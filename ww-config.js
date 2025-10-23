export default {
  editor: {
    label: {
      en: "Advanced Calendar",
      pt: "Calendário Avançado"
    },
    icon: "calendar"
  },
  triggerEvents: [
    {
      name: 'date-select',
      label: { en: 'Date Selected', pt: 'Data Selecionada' },
      event: {
        date: '',
        availableSlots: [],
        dayOfWeek: 0
      },
      default: true
    },
    {
      name: 'event-create',
      label: { en: 'Event Created', pt: 'Agendamento Criado' },
      event: {
        id: '',
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        shiftId: '',
        color: '',
        customFields: ''
      }
    },
    {
      name: 'event-update',
      label: { en: 'Event Updated', pt: 'Agendamento Atualizado' },
      event: {
        id: '',
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        shiftId: '',
        color: '',
        customFields: '',
        previousEventId: ''
      }
    },
    {
      name: 'event-delete',
      label: { en: 'Event Deleted', pt: 'Agendamento Deletado' },
      event: {
        eventId: '',
        event: {}
      }
    },
    {
      name: 'event-click',
      label: { en: 'Event Clicked', pt: 'Agendamento Clicado' },
      event: {
        event: {},
        date: '',
        time: ''
      }
    },
    {
      name: 'slot-click',
      label: { en: 'Time Slot Clicked', pt: 'Slot de Horário Clicado' },
      event: {
        date: '',
        time: '',
        shift: {},
        available: true
      }
    },
    {
      name: 'view-change',
      label: { en: 'View Changed', pt: 'Visualização Alterada' },
      event: {
        view: '',
        date: ''
      }
    },
    {
      name: 'navigation',
      label: { en: 'Navigation', pt: 'Navegação' },
      event: {
        direction: '',
        currentDate: '',
        view: ''
      }
    }
  ],
  properties: {
    // ==================== VIEW SETTINGS ====================
    viewMode: {
      label: { en: 'View Mode', pt: 'Modo de Visualização' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: 'month', label: 'Mês' },
          { value: 'week', label: 'Semana' },
          { value: 'day', label: 'Dia' }
        ]
      },
      defaultValue: 'month',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Valores válidos: month | week | day'
      },
      propertyHelp: 'Modo de visualização do calendário: mês mostra grade completa, semana mostra 7 dias com slots de horário, dia mostra detalhes de um único dia'
      /* wwEditor:end */
    },

    initialDate: {
      label: { en: 'Initial Date', pt: 'Data Inicial' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Data no formato ISO (AAAA-MM-DD) ou deixe vazio para hoje'
      },
      propertyHelp: 'Data inicial para o calendário (formato: AAAA-MM-DD). Deixe vazio para iniciar em hoje.'
      /* wwEditor:end */
    },

    locale: {
      label: { en: 'Locale', pt: 'Idioma' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: 'pt-BR', label: 'Português (Brasil)' },
          { value: 'en-US', label: 'Inglês (EUA)' },
          { value: 'es-ES', label: 'Espanhol' },
          { value: 'fr-FR', label: 'Francês' },
          { value: 'de-DE', label: 'Alemão' }
        ]
      },
      defaultValue: 'pt-BR',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Código de idioma válido (pt-BR, en-US, es-ES, fr-FR, de-DE)'
      }
      /* wwEditor:end */
    },

    firstDayOfWeek: {
      label: { en: 'First Day of Week', pt: 'Primeiro Dia da Semana' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: 0, label: 'Domingo' },
          { value: 1, label: 'Segunda-feira' }
        ]
      },
      defaultValue: 0,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'number',
        tooltip: 'Valores válidos: 0 (Domingo) | 1 (Segunda-feira)'
      }
      /* wwEditor:end */
    },

    slotDuration: {
      label: { en: 'Time Slot Duration (minutes)', pt: 'Duração do Slot (minutos)' },
      type: 'Number',
      section: 'settings',
      min: 5,
      max: 120,
      step: 5,
      defaultValue: 30,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'number',
        tooltip: 'Duração em minutos de cada slot de horário (5-120)'
      },
      propertyHelp: 'Duração em minutos de cada slot de horário disponível. Usado para calcular os horários disponíveis para agendamento.'
      /* wwEditor:end */
    },

    displayStartHour: {
      label: { en: 'Display Start Hour', pt: 'Hora Inicial de Exibição' },
      type: 'Number',
      section: 'settings',
      min: 0,
      max: 23,
      step: 1,
      defaultValue: 8,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'number',
        tooltip: 'Primeira hora a ser exibida nas visualizações Semana e Dia (0-23)'
      },
      propertyHelp: 'Define a partir de qual hora o calendário será exibido (ex: 8 para 8h da manhã)'
      /* wwEditor:end */
    },

    displayEndHour: {
      label: { en: 'Display End Hour', pt: 'Hora Final de Exibição' },
      type: 'Number',
      section: 'settings',
      min: 0,
      max: 23,
      step: 1,
      defaultValue: 18,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'number',
        tooltip: 'Última hora a ser exibida nas visualizações Semana e Dia (0-23)'
      },
      propertyHelp: 'Define até qual hora o calendário será exibido (ex: 18 para 18h)'
      /* wwEditor:end */
    },

    // ==================== SHIFTS ARRAY ====================
    shifts: {
      label: { en: 'Available Shifts', pt: 'Turnos Disponíveis' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        {
          id: 'shift-morning',
          name: 'Manhã',
          startTime: '08:00',
          endTime: '12:00',
          daysOfWeek: '1,2,3,4,5',
          startDate: '',
          endDate: '',
          color: '#4CAF50',
          enabled: true
        }
      ],
      options: {
        expandable: true,
        getItemLabel(item) {
          return `${item?.name || 'Unnamed Shift'} (${item?.startTime || '00:00'} - ${item?.endTime || '00:00'})`;
        },
        item: {
          type: 'Object',
          defaultValue: {
            id: '',
            name: 'Novo Turno',
            startTime: '09:00',
            endTime: '17:00',
            daysOfWeek: '1,2,3,4,5',
            startDate: '',
            endDate: '',
            color: '#2196F3',
            enabled: true
          },
          options: {
            item: {
              id: {
                label: { en: 'ID', pt: 'ID' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              },
              name: {
                label: { en: 'Shift Name', pt: 'Nome do Turno' },
                type: 'Text',
                bindable: true,
                defaultValue: 'Novo Turno'
              },
              startTime: {
                label: { en: 'Start Time', pt: 'Horário Início' },
                type: 'Text',
                bindable: true,
                defaultValue: '09:00',
                /* wwEditor:start */
                propertyHelp: 'Formato: HH:MM (ex: 08:30)'
                /* wwEditor:end */
              },
              endTime: {
                label: { en: 'End Time', pt: 'Horário Fim' },
                type: 'Text',
                bindable: true,
                defaultValue: '17:00',
                /* wwEditor:start */
                propertyHelp: 'Formato: HH:MM (ex: 18:00)'
                /* wwEditor:end */
              },
              daysOfWeek: {
                label: { en: 'Days of Week', pt: 'Dias da Semana' },
                type: 'Text',
                bindable: true,
                defaultValue: '1,2,3,4,5',
                /* wwEditor:start */
                propertyHelp: 'Números separados por vírgula: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado. Exemplo: 1,2,3,4,5 para dias úteis'
                /* wwEditor:end */
              },
              startDate: {
                label: { en: 'Start Date (optional)', pt: 'Data Início (opcional)' },
                type: 'Text',
                bindable: true,
                defaultValue: '',
                /* wwEditor:start */
                propertyHelp: 'Formato: AAAA-MM-DD (Exemplo: 2025-10-15 para 15 de outubro de 2025). Deixe vazio para sempre disponível.'
                /* wwEditor:end */
              },
              endDate: {
                label: { en: 'End Date (optional)', pt: 'Data Fim (opcional)' },
                type: 'Text',
                bindable: true,
                defaultValue: '',
                /* wwEditor:start */
                propertyHelp: 'Formato: AAAA-MM-DD (Exemplo: 2025-12-31 para 31 de dezembro de 2025). Deixe vazio para sempre disponível.'
                /* wwEditor:end */
              },
              color: {
                label: { en: 'Color', pt: 'Cor' },
                type: 'Color',
                bindable: true,
                defaultValue: '#2196F3'
              },
              enabled: {
                label: { en: 'Enabled', pt: 'Ativo' },
                type: 'OnOff',
                bindable: true,
                defaultValue: true
              }
            }
          }
        }
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Array de turnos disponíveis para agendamento'
      },
      propertyHelp: 'Configure os turnos de trabalho disponíveis. Cada turno define horários específicos e dias da semana.'
      /* wwEditor:end */
    },

    // Formula properties for shifts
    shiftsIdFormula: {
      label: { en: 'Shift ID Field', pt: 'Campo ID do Turno' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.shifts) && content.shifts.length > 0 ? content.shifts[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['id']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.shifts) || !content.shifts?.length || !boundProps?.shifts,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair o ID do turno dos dados vinculados'
      }
      /* wwEditor:end */
    },

    shiftsNameFormula: {
      label: { en: 'Shift Name Field', pt: 'Campo Nome do Turno' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.shifts) && content.shifts.length > 0 ? content.shifts[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['name']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.shifts) || !content.shifts?.length || !boundProps?.shifts,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair o nome do turno dos dados vinculados'
      }
      /* wwEditor:end */
    },

    shiftsStartTimeFormula: {
      label: { en: 'Start Time Field', pt: 'Campo Horário Início' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.shifts) && content.shifts.length > 0 ? content.shifts[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['startTime']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.shifts) || !content.shifts?.length || !boundProps?.shifts,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair o horário de início dos dados vinculados'
      }
      /* wwEditor:end */
    },

    shiftsEndTimeFormula: {
      label: { en: 'End Time Field', pt: 'Campo Horário Fim' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.shifts) && content.shifts.length > 0 ? content.shifts[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['endTime']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.shifts) || !content.shifts?.length || !boundProps?.shifts,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair o horário de término dos dados vinculados'
      }
      /* wwEditor:end */
    },

    shiftsColorFormula: {
      label: { en: 'Color Field', pt: 'Campo Cor' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.shifts) && content.shifts.length > 0 ? content.shifts[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['color']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.shifts) || !content.shifts?.length || !boundProps?.shifts,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair a cor dos dados vinculados'
      }
      /* wwEditor:end */
    },

    // ==================== EVENTS ARRAY ====================
    events: {
      label: { en: 'Events/Bookings', pt: 'Agendamentos' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(item) {
          const title = item?.title || 'Untitled Event';
          const date = item?.date || '';
          const time = item?.startTime || '';
          return `${title} - ${date} ${time}`;
        },
        item: {
          type: 'Object',
          defaultValue: {
            id: '',
            title: '',
            description: '',
            date: '',
            startTime: '',
            endTime: '',
            shiftId: '',
            color: '#1967d2',
            customFields: '{}'
          },
          options: {
            item: {
              id: {
                label: { en: 'ID', pt: 'ID' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              },
              title: {
                label: { en: 'Title', pt: 'Título' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              },
              description: {
                label: { en: 'Description', pt: 'Descrição' },
                type: 'LongText',
                bindable: true,
                defaultValue: ''
              },
              date: {
                label: { en: 'Date (YYYY-MM-DD)', pt: 'Data (AAAA-MM-DD)' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              },
              startTime: {
                label: { en: 'Start Time (HH:MM)', pt: 'Hora Início (HH:MM)' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              },
              endTime: {
                label: { en: 'End Time (HH:MM)', pt: 'Hora Fim (HH:MM)' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              },
              shiftId: {
                label: { en: 'Shift ID', pt: 'ID do Turno' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              },
              color: {
                label: { en: 'Color', pt: 'Cor' },
                type: 'Color',
                bindable: true,
                defaultValue: '#1967d2'
              },
              customFields: {
                label: { en: 'Custom Fields', pt: 'Campos Personalizados' },
                type: 'Text',
                bindable: true,
                defaultValue: '{}',
                /* wwEditor:start */
                propertyHelp: 'Campos adicionais em formato JSON: {"campo1":"valor1","campo2":"valor2"}'
                /* wwEditor:end */
              }
            }
          }
        }
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Array de objetos de evento/agendamento com id, título, data, horários e campos personalizados'
      },
      propertyHelp: 'Eventos ou agendamentos para exibir no calendário. Pode ser vinculado a fontes de dados externas como bancos de dados ou APIs.'
      /* wwEditor:end */
    },

    // Formula properties for events
    eventsIdFormula: {
      label: { en: 'Event ID Field', pt: 'Campo ID do Evento' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.events) && content.events.length > 0 ? content.events[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['id']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.events) || !content.events?.length || !boundProps?.events,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair o ID do evento dos dados vinculados'
      }
      /* wwEditor:end */
    },

    eventsTitleFormula: {
      label: { en: 'Event Title Field', pt: 'Campo Título do Evento' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.events) && content.events.length > 0 ? content.events[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['title']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.events) || !content.events?.length || !boundProps?.events,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair o título do evento dos dados vinculados'
      }
      /* wwEditor:end */
    },

    eventsDateFormula: {
      label: { en: 'Event Date Field', pt: 'Campo Data do Evento' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.events) && content.events.length > 0 ? content.events[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['date']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.events) || !content.events?.length || !boundProps?.events,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair a data do evento dos dados vinculados'
      }
      /* wwEditor:end */
    },

    eventsStartTimeFormula: {
      label: { en: 'Start Time Field', pt: 'Campo Hora Início' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.events) && content.events.length > 0 ? content.events[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['startTime']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.events) || !content.events?.length || !boundProps?.events,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair o horário de início dos dados vinculados'
      }
      /* wwEditor:end */
    },

    eventsEndTimeFormula: {
      label: { en: 'End Time Field', pt: 'Campo Hora Fim' },
      type: 'Formula',
      section: 'settings',
      options: content => ({
        template: Array.isArray(content?.events) && content.events.length > 0 ? content.events[0] : null,
      }),
      defaultValue: {
        type: 'f',
        code: "context.mapping?.['endTime']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content?.events) || !content.events?.length || !boundProps?.events,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Fórmula para extrair o horário de término dos dados vinculados'
      }
      /* wwEditor:end */
    },

    // ==================== DISABLED DATES ====================
    disabledDates: {
      label: { en: 'Disabled Dates', pt: 'Datas Desabilitadas' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: false,
        item: {
          type: 'Text',
          defaultValue: ''
        }
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Array de datas no formato AAAA-MM-DD que devem ser desabilitadas'
      },
      propertyHelp: 'Lista de datas específicas para desabilitar (ex: feriados). Formato: AAAA-MM-DD. Exemplo: 2025-12-25'
      /* wwEditor:end */
    },

    // ==================== CUSTOM EVENT FIELDS ====================
    customEventFields: {
      label: { en: 'Custom Event Fields', pt: 'Campos Personalizados dos Eventos' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        {
          id: 'field-1',
          name: 'Nome do Cliente',
          type: 'text',
          required: true,
          placeholder: 'Digite o nome'
        }
      ],
      options: {
        expandable: true,
        getItemLabel(item) {
          return item?.name || 'Campo sem nome';
        },
        item: {
          type: 'Object',
          defaultValue: {
            id: '',
            name: 'Novo Campo',
            type: 'text',
            required: false,
            placeholder: ''
          },
          options: {
            item: {
              id: {
                label: { en: 'Field ID', pt: 'ID do Campo' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              },
              name: {
                label: { en: 'Field Name', pt: 'Nome do Campo' },
                type: 'Text',
                bindable: true,
                defaultValue: 'Novo Campo'
              },
              type: {
                label: { en: 'Field Type', pt: 'Tipo' },
                type: 'TextSelect',
                options: {
                  options: [
                    { value: 'text', label: 'Texto' },
                    { value: 'textarea', label: 'Texto Longo' },
                    { value: 'number', label: 'Número' },
                    { value: 'email', label: 'Email' },
                    { value: 'phone', label: 'Telefone' }
                  ]
                },
                bindable: true,
                defaultValue: 'text'
              },
              required: {
                label: { en: 'Required', pt: 'Obrigatório' },
                type: 'OnOff',
                bindable: true,
                defaultValue: false
              },
              placeholder: {
                label: { en: 'Placeholder', pt: 'Placeholder' },
                type: 'Text',
                bindable: true,
                defaultValue: ''
              }
            }
          }
        }
      },
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip: 'Array de definições de campos personalizados para formulários de eventos'
      },
      propertyHelp: 'Define campos adicionais para criação/edição de eventos (ex: nome do cliente, telefone, observações)'
      /* wwEditor:end */
    },

    // ==================== DATE FORMAT ====================
    dateInputFormat: {
      label: { en: 'Date Input Format', pt: 'Formato de Entrada de Data' },
      type: 'TextSelect',
      section: 'settings',
      options: {
        options: [
          { value: 'yyyy-MM-dd', label: 'AAAA-MM-DD (ISO)' },
          { value: 'dd/MM/yyyy', label: 'DD/MM/AAAA (BR)' },
          { value: 'MM/dd/yyyy', label: 'MM/DD/AAAA (EUA)' }
        ]
      },
      defaultValue: 'dd/MM/yyyy',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Formato preferido para entrada/exibição de datas'
      },
      propertyHelp: 'Escolha o formato de data preferido para exibição e entrada de dados'
      /* wwEditor:end */
    },

    // ==================== STYLE SETTINGS ====================
    backgroundColor: {
      label: { en: 'Background Color', pt: 'Cor de Fundo' },
      type: 'Color',
      section: 'style',
      defaultValue: '#ffffff',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Cor de fundo em formato hexadecimal'
      }
      /* wwEditor:end */
    },

    borderColor: {
      label: { en: 'Border Color', pt: 'Cor da Borda' },
      type: 'Color',
      section: 'style',
      defaultValue: '#e0e0e0',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Cor da borda em formato hexadecimal'
      }
      /* wwEditor:end */
    },

    textColor: {
      label: { en: 'Text Color', pt: 'Cor do Texto' },
      type: 'Color',
      section: 'style',
      defaultValue: '#202124',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Cor do texto principal em formato hexadecimal'
      }
      /* wwEditor:end */
    },

    todayColor: {
      label: { en: 'Today Highlight Color', pt: 'Cor de Destaque do Dia Atual' },
      type: 'Color',
      section: 'style',
      defaultValue: '#e8f0fe',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Background color for today\'s date'
      }
      /* wwEditor:end */
    },

    hoverColor: {
      label: { en: 'Hover Color', pt: 'Cor de Hover' },
      type: 'Color',
      section: 'style',
      defaultValue: '#f1f3f4',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Cor de fundo ao passar o mouse'
      }
      /* wwEditor:end */
    },

    primaryColor: {
      label: { en: 'Primary Color', pt: 'Cor Primária' },
      type: 'Color',
      section: 'style',
      defaultValue: '#1967d2',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Cor de destaque primária para botões e realces'
      }
      /* wwEditor:end */
    },

    disabledColor: {
      label: { en: 'Disabled Day Color', pt: 'Cor de Dia Desabilitado' },
      type: 'Color',
      section: 'style',
      defaultValue: '#f5f5f5',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Cor de fundo para datas desabilitadas'
      }
      /* wwEditor:end */
    },

    borderRadius: {
      label: { en: 'Border Radius', pt: 'Raio da Borda' },
      type: 'Length',
      section: 'style',
      defaultValue: '8px',
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Raio da borda para calendário e elementos'
      }
      /* wwEditor:end */
    },

    // ==================== INTERACTION SETTINGS ====================
    allowEventClick: {
      label: { en: 'Allow Event Click', pt: 'Permitir Click em Eventos' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'boolean',
        tooltip: 'Habilitar/desabilitar clique em eventos'
      }
      /* wwEditor:end */
    },

    allowSlotClick: {
      label: { en: 'Allow Slot Click', pt: 'Permitir Click em Slots' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'boolean',
        tooltip: 'Habilitar/desabilitar clique em slots de horário'
      }
      /* wwEditor:end */
    },

    showWeekNumbers: {
      label: { en: 'Show Week Numbers', pt: 'Mostrar Números da Semana' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: false,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'boolean',
        tooltip: 'Mostrar números das semanas na visualização mensal'
      }
      /* wwEditor:end */
    },

    showWeekends: {
      label: { en: 'Show Weekends', pt: 'Mostrar Finais de Semana' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'boolean',
        tooltip: 'Mostrar/ocultar sábado e domingo nas visualizações de semana/dia'
      }
      /* wwEditor:end */
    },

    timeFormat24h: {
      label: { en: '24-Hour Format', pt: 'Formato 24 Horas' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'boolean',
        tooltip: 'Usar formato de 24 horas (verdadeiro) ou 12 horas AM/PM (falso)'
      }
      /* wwEditor:end */
    },

    showShiftIndicators: {
      label: { en: 'Show Shift Indicators', pt: 'Mostrar Indicadores de Turno' },
      type: 'OnOff',
      section: 'settings',
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: 'boolean',
        tooltip: 'Mostrar cores dos turnos nos slots disponíveis'
      },
      propertyHelp: 'Exibe indicadores visuais coloridos para identificar diferentes turnos no calendário'
      /* wwEditor:end */
    }
  }
};
