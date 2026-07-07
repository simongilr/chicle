import { RuntimeForm } from '../form-runtime.service';

export const FORMLY_RUNTIME_EXAMPLE: RuntimeForm = {
  key: 'component_showcase',
  title: 'Solicitud de contacto',
  version: 1,
  presentation: {
    profileKey: 'adaptive',
    kit: 'auto',
    theme: 'chicle'
  },
  fields: [],
  steps: [
    {
      key: 'identity',
      title: 'Datos principales',
      description: 'Información necesaria para identificar la solicitud.',
      fields: [
        {
          name: 'identity_title',
          type: 'title',
          label: 'Información de contacto',
          layout: 'full'
        },
        {
          name: 'identity_intro',
          type: 'paragraph',
          label: '',
          text: 'Completa los datos marcados como obligatorios.',
          layout: 'full'
        },
        {
          name: 'name',
          type: 'text',
          label: 'Nombre',
          required: true,
          placeholder: 'Nombre visible',
          transform: 'trim',
          length: { min: 3, max: 80 }
        },
        {
          name: 'email',
          type: 'email',
          label: 'Correo',
          required: true,
          placeholder: 'persona@example.com'
        },
        {
          name: 'channel',
          type: 'select',
          label: 'Canal preferido',
          required: true,
          options: [
            { label: 'Correo', value: 'email' },
            { label: 'Teléfono', value: 'phone' }
          ]
        },
        {
          name: 'phone',
          type: 'tel',
          label: 'Teléfono',
          placeholder: '+57 300 000 0000',
          visibleWhen: {
            field: 'channel',
            operator: 'equals',
            value: 'phone'
          }
        }
      ]
    },
    {
      key: 'preferences',
      title: 'Preferencias',
      description: 'Opciones adicionales de la solicitud.',
      fields: [
        {
          name: 'priority',
          type: 'radio',
          label: 'Prioridad',
          required: true,
          layout: 'full',
          options: [
            { label: 'Normal', value: 'normal' },
            { label: 'Alta', value: 'high' }
          ]
        },
        {
          name: 'contactDate',
          type: 'date',
          label: 'Fecha de contacto'
        },
        {
          name: 'notifications',
          type: 'toggle',
          label: 'Notificaciones',
          placeholder: 'Recibir actualizaciones'
        },
        {
          name: 'notesDivider',
          type: 'divider',
          label: '',
          layout: 'full'
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Observaciones',
          placeholder: 'Información adicional',
          layout: 'full',
          length: { max: 500 }
        }
      ]
    }
  ]
};

export const FORMLY_FIELD_LIBRARY_EXAMPLE: RuntimeForm = {
  key: 'field_library',
  title: 'Biblioteca de campos',
  version: 1,
  presentation: {
    profileKey: 'adaptive',
    kit: 'auto',
    theme: 'chicle'
  },
  fields: [
    {
      name: 'library_title',
      type: 'title',
      label: 'Contenido y estructura',
      layout: 'full'
    },
    {
      name: 'library_intro',
      type: 'paragraph',
      label: '',
      text: 'Los mismos objetos funcionan con PrimeNG, Ionic o controles base.',
      layout: 'full'
    },
    {
      name: 'text',
      type: 'text',
      label: 'Texto',
      placeholder: 'Nombre o referencia'
    },
    {
      name: 'email',
      type: 'email',
      label: 'Correo',
      placeholder: 'persona@example.com'
    },
    {
      name: 'password',
      type: 'password',
      label: 'Contraseña',
      placeholder: 'Valor protegido'
    },
    {
      name: 'number',
      type: 'number',
      label: 'Número',
      placeholder: '0'
    },
    {
      name: 'currency',
      type: 'currency',
      label: 'Moneda',
      placeholder: '0.00',
      config: {
        currency: 'COP'
      }
    },
    {
      name: 'telephone',
      type: 'tel',
      label: 'Teléfono',
      placeholder: '+57 300 000 0000'
    },
    {
      name: 'url',
      type: 'url',
      label: 'URL',
      placeholder: 'https://example.com'
    },
    {
      name: 'date',
      type: 'date',
      label: 'Fecha'
    },
    {
      name: 'time',
      type: 'time',
      label: 'Hora'
    },
    {
      name: 'datetime',
      type: 'datetime',
      label: 'Fecha y hora'
    },
    {
      name: 'select',
      type: 'select',
      label: 'Selector',
      placeholder: 'Selecciona una opción',
      options: [
        { label: 'Primera opción', value: 'first' },
        { label: 'Segunda opción', value: 'second' }
      ]
    },
    {
      name: 'radio',
      type: 'radio',
      label: 'Opciones únicas',
      layout: 'full',
      options: [
        { label: 'Opción A', value: 'a' },
        { label: 'Opción B', value: 'b' }
      ]
    },
    {
      name: 'checkbox',
      type: 'checkbox',
      label: 'Casilla',
      placeholder: 'Confirmar selección'
    },
    {
      name: 'toggle',
      type: 'toggle',
      label: 'Interruptor',
      placeholder: 'Activar opción'
    },
    {
      name: 'file',
      type: 'file',
      label: 'Archivo',
      placeholder: 'Adjuntar documento',
      layout: 'full',
      config: {
        accept: '*/*'
      }
    },
    {
      name: 'image',
      type: 'image',
      label: 'Imagen',
      placeholder: 'Adjuntar foto',
      layout: 'full',
      config: {
        accept: 'image/*',
        capture: 'environment'
      }
    },
    {
      name: 'gps',
      type: 'gps',
      label: 'Ubicación GPS',
      placeholder: 'Capturar ubicación',
      layout: 'full'
    },
    {
      name: 'library_divider',
      type: 'divider',
      label: '',
      layout: 'full'
    },
    {
      name: 'textarea',
      type: 'textarea',
      label: 'Texto largo',
      placeholder: 'Observaciones o descripción',
      layout: 'full'
    }
  ]
};
