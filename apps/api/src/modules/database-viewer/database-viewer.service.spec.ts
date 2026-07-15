import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource, Repository } from "typeorm";
import { AuthContext } from "../auth/auth.types";
import { DatabaseViewerService } from "./database-viewer.service";
import { SchemaChange } from "./schema-change.entity";

describe("DatabaseViewerService schema safety", () => {
  const dataSource = {
    entityMetadatas: [],
    query: jest.fn(),
  };
  const config = {
    get: jest.fn(),
  };
  const schemaChanges = {} as Repository<SchemaChange>;
  let service: DatabaseViewerService;

  const ownerAuth = {
    user: {
      id: "owner-1",
      tenantId: "tenant-1",
      email: "owner@example.com",
      name: "Owner",
      systemRole: "owner",
    },
    tenant: {
      id: "tenant-1",
      slug: "acme",
      name: "Acme",
    },
    roles: [],
    permissions: [],
  } as unknown as AuthContext;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DatabaseViewerService(
      dataSource as unknown as DataSource,
      config as unknown as ConfigService,
      schemaChanges,
    );
  });

  it("generates a tenant-scoped table and reversible TypeORM migration preview", async () => {
    dataSource.query.mockResolvedValue([{ total: 0 }]);

    const preview = await service.previewSchemaChange(ownerAuth, {
      operation: "create_table",
      tableName: "custom_clients",
      columns: [
        { name: "name", type: "string", length: 180, nullable: false },
        {
          name: "active",
          type: "boolean",
          nullable: false,
          defaultValue: true,
        },
      ],
    });

    expect(preview.sql).toContain("CREATE TABLE `custom_clients`");
    expect(preview.sql).toContain("`tenantId` varchar(36) NOT NULL");
    expect(preview.sql).toContain("`name` varchar(180) NOT NULL");
    expect(preview.sql).toContain("`active` tinyint(1) NOT NULL DEFAULT 1");
    expect(preview.migrationSource).toContain("implements MigrationInterface");
    expect(preview.migrationSource).toContain(
      "DROP TABLE IF EXISTS `custom_clients`",
    );
  });

  it("rejects schema access for a non-administrative tenant user", async () => {
    const viewerAuth = {
      ...ownerAuth,
      user: { ...ownerAuth.user, id: "viewer-1", systemRole: "viewer" },
    } as unknown as AuthContext;

    await expect(
      service.previewSchemaChange(viewerAuth, {
        operation: "create_table",
        tableName: "custom_clients",
        columns: [{ name: "name", type: "string" }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it("rejects tables outside the custom namespace", async () => {
    await expect(
      service.previewSchemaChange(ownerAuth, {
        operation: "create_table",
        tableName: "users",
        columns: [{ name: "name", type: "string" }],
      }),
    ).rejects.toThrow("Custom tables must start with custom_");
  });

  it("requires a safe default before adding a mandatory column", async () => {
    dataSource.query
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([{ total: 0 }]);

    await expect(
      service.previewSchemaChange(ownerAuth, {
        operation: "add_column",
        tableName: "custom_clients",
        column: { name: "document", type: "string", nullable: false },
      }),
    ).rejects.toThrow(
      "Adding a NOT NULL column requires a default value or nullable=true",
    );
  });

  it("protects tenant and identity columns from destructive changes", async () => {
    dataSource.query.mockResolvedValue([{ total: 1 }]);

    await expect(
      service.previewSchemaChange(ownerAuth, {
        operation: "drop_column",
        tableName: "custom_clients",
        currentColumnName: "tenantId",
        confirmation: "DROP custom_clients.tenantId",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("allows owner users to preview dropping custom tables only in local development mode", async () => {
    config.get.mockImplementation((key: string, fallback: string) =>
      key === "CHICLE_SCHEMA_ALLOW_DROP_TABLE" ? "true" : fallback,
    );
    dataSource.query.mockResolvedValue([{ total: 1 }]);

    const preview = await service.previewSchemaChange(ownerAuth, {
      operation: "drop_table",
      tableName: "custom_clients",
      confirmation: "DROP TABLE custom_clients",
    });

    expect(preview.sql).toBe("DROP TABLE `custom_clients`");
    expect(preview.warnings.join(" ")).toContain("desarrollo local");
    expect(preview.migrationSource).toContain("DROP TABLE IF EXISTS \\`custom_clients\\`");
  });

  it("blocks dropping custom tables when the development flag is disabled", async () => {
    config.get.mockImplementation((_key: string, fallback: string) => fallback);

    await expect(
      service.previewSchemaChange(ownerAuth, {
        operation: "drop_table",
        tableName: "custom_clients",
        confirmation: "DROP TABLE custom_clients",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("deletes only one tenant-scoped row from a custom table", async () => {
    const table = {
      name: "custom_clients",
      entity: "custom_clients",
      scope: "tenant",
      source: "schema",
      editable: true,
      designable: true,
      columns: [
        { name: "id", type: "varchar", nullable: false, primary: true, editable: false },
        { name: "tenantId", type: "varchar", nullable: false, primary: false, editable: false },
        { name: "name", type: "varchar", nullable: true, primary: false, editable: true },
      ],
    };
    dataSource.query.mockResolvedValueOnce([{ id: "row-1" }]).mockResolvedValueOnce({ affectedRows: 1 });

    const result = await (service as unknown as { deleteCustomRow: Function }).deleteCustomRow(ownerAuth, table, "row-1");

    expect(dataSource.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("SELECT `id` FROM `custom_clients`"),
      ["row-1", "tenant-1"],
    );
    expect(dataSource.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("DELETE FROM `custom_clients`"),
      ["row-1", "tenant-1"],
    );
    expect(result).toEqual({ table, id: "row-1", deleted: true });
  });
});
