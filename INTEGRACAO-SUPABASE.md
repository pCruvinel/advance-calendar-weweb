# 📘 Guia Completo de Implementação - Advanced Calendar + Supabase

## 📋 Índice

1. [Configuração do Backend (Supabase)](#1-configuração-do-backend-supabase)
2. [Configuração do WeWeb](#2-configuração-do-weweb)
3. [Guia de Vinculação de Dados](#3-guia-de-vinculação-de-dados)
4. [Funcionalidades para o Usuário Final](#4-funcionalidades-para-o-usuário-final)
5. [Testes e Validação](#5-testes-e-validação)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Configuração do Backend (Supabase)

### 1.1 Criar Tabela de Eventos

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Criar tabela de eventos
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  shift_id VARCHAR(100),
  color VARCHAR(7) DEFAULT '#1967d2',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_date_user ON events(date, user_id);

-- Adicionar comentários para documentação
COMMENT ON TABLE events IS 'Armazena todos os eventos/agendamentos do calendário';
COMMENT ON COLUMN events.custom_fields IS 'Campos personalizados em formato JSON (ex: telefone, observações)';
COMMENT ON COLUMN events.shift_id IS 'ID do turno associado ao evento';
```

### 1.2 Configurar Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios eventos
CREATE POLICY "Usuários visualizam próprios eventos"
  ON events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem criar seus próprios eventos
CREATE POLICY "Usuários criam próprios eventos"
  ON events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios eventos
CREATE POLICY "Usuários atualizam próprios eventos"
  ON events
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios eventos
CREATE POLICY "Usuários deletam próprios eventos"
  ON events
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 1.3 Funções SQL Opcionais

#### Função para atualizar timestamp automaticamente

```sql
-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Função para buscar eventos de um período

```sql
-- Função para buscar eventos de um mês específico
CREATE OR REPLACE FUNCTION get_events_by_month(
  target_year INT,
  target_month INT,
  target_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  shift_id VARCHAR,
  color VARCHAR,
  custom_fields JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.date,
    e.start_time,
    e.end_time,
    e.shift_id,
    e.color,
    e.custom_fields
  FROM events e
  WHERE
    EXTRACT(YEAR FROM e.date) = target_year
    AND EXTRACT(MONTH FROM e.date) = target_month
    AND e.user_id = target_user_id
  ORDER BY e.date, e.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Função para validar conflitos de horário

```sql
-- Função para verificar conflitos de horário
CREATE OR REPLACE FUNCTION check_time_conflict(
  check_date DATE,
  check_start_time TIME,
  check_end_time TIME,
  check_user_id UUID,
  exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  has_conflict BOOLEAN,
  conflicting_event_title VARCHAR
) AS $$
DECLARE
  conflict_count INT;
  conflict_title VARCHAR;
BEGIN
  SELECT COUNT(*), MAX(title)
  INTO conflict_count, conflict_title
  FROM events
  WHERE
    date = check_date
    AND user_id = check_user_id
    AND (exclude_event_id IS NULL OR id != exclude_event_id)
    AND (
      (start_time <= check_start_time AND end_time > check_start_time)
      OR (start_time < check_end_time AND end_time >= check_end_time)
      OR (start_time >= check_start_time AND end_time <= check_end_time)
    );

  RETURN QUERY SELECT (conflict_count > 0), conflict_title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2. Configuração do WeWeb

### 2.1 Variáveis Necessárias

Crie as seguintes variáveis no WeWeb (Variables):

#### **current_date** (String)
- **Tipo**: String
- **Valor Inicial**:
  ```javascript
  new Date().toISOString().substring(0, 10)
  ```
- **Descrição**: Armazena a data atual visível no calendário (formato: YYYY-MM-DD)

#### **selected_event** (Object)
- **Tipo**: Object
- **Valor Inicial**:
  ```javascript
  {
    id: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    shiftId: '',
    color: '#1967d2',
    customFields: {}
  }
  ```
- **Descrição**: Armazena o evento sendo criado ou editado

#### **events_list** (Array)
- **Tipo**: Array
- **Valor Inicial**: `[]`
- **Descrição**: Lista de todos os eventos carregados do Supabase

#### **selected_date** (String)
- **Tipo**: String
- **Valor Inicial**: `''`
- **Descrição**: Data clicada pelo usuário para criar novo evento

#### **calendar_year** (Number)
- **Tipo**: Number
- **Valor Inicial**:
  ```javascript
  new Date().getFullYear()
  ```
- **Descrição**: Ano visível no calendário

#### **calendar_month** (Number)
- **Tipo**: Number
- **Valor Inicial**:
  ```javascript
  new Date().getMonth() + 1
  ```
- **Descrição**: Mês visível no calendário (1-12)

---

### 2.2 Configuração de Collections

#### Collection: `events_collection`

**Configuração da Collection:**

1. **Data Source**: Supabase
2. **Table**: `events`
3. **Mode**: Dynamic (Auto-reload)
4. **Filter by**:
   - `user_id` = `{{ @user.id }}`
   - `date` >= `{{ @calendar_year }}-{{ @calendar_month.toString().padStart(2, '0') }}-01`
   - `date` <= Última data do mês (calcular dinamicamente)

**Query Filter (Advanced):**

```javascript
{
  "user_id": "{{ @user.id }}",
  "date": {
    "gte": "{{ @calendar_year }}-{{ @calendar_month.toString().padStart(2, '0') }}-01",
    "lte": "{{ new Date(@calendar_year, @calendar_month, 0).toISOString().substring(0, 10) }}"
  }
}
```

**Order by**: `date` (ascending), `start_time` (ascending)

---

### 2.3 Workflows

#### **Workflow 1: On Page Load - Carregar Eventos Iniciais**

**Trigger**: `Page: On Load`

**Actions**:

1. **Set Variable** → `calendar_year`
   - Value: `new Date().getFullYear()`

2. **Set Variable** → `calendar_month`
   - Value: `new Date().getMonth() + 1`

3. **Fetch Collection** → `events_collection`
   - Aguarda conclusão

4. **Set Variable** → `events_list`
   - Value: `{{ @events_collection }}`

---

#### **Workflow 2: On Next/Previous Month Click - Navegação de Meses**

**Trigger**: `Calendar: On Date Change`

**Actions**:

1. **Set Variable** → `calendar_year`
   - Value: `{{ trigger.year }}`

2. **Set Variable** → `calendar_month`
   - Value: `{{ trigger.month }}`

3. **Set Variable** → `current_date`
   - Value: `{{ trigger.year }}-{{ trigger.month.toString().padStart(2, '0') }}-01`

4. **Fetch Collection** → `events_collection`
   - Force Refresh: `true`

5. **Set Variable** → `events_list`
   - Value: `{{ @events_collection }}`

---

#### **Workflow 3: On Day Click - Abrir Modal para Novo Evento**

**Trigger**: `Calendar: On Day Click`

**Actions**:

1. **Set Variable** → `selected_date`
   - Value: `{{ trigger.date }}`

2. **Set Variable** → `selected_event`
   - Value:
     ```javascript
     {
       id: '',
       title: '',
       description: '',
       date: {{ trigger.date }},
       startTime: '',
       endTime: '',
       shiftId: '',
       color: '#1967d2',
       customFields: {}
     }
     ```

3. **Show Modal** → `event_modal`

---

#### **Workflow 4: On Event Create - Criar Novo Evento**

**Trigger**: `Calendar: Event Created`

**Actions**:

1. **Supabase Insert** → `events` table
   - Mapping:
     ```javascript
     {
       title: {{ trigger.event.title }},
       description: {{ trigger.event.description }},
       date: {{ trigger.event.date }},
       start_time: {{ trigger.event.startTime }},
       end_time: {{ trigger.event.endTime }},
       shift_id: {{ trigger.event.shiftId }},
       color: {{ trigger.event.color }},
       custom_fields: {{ trigger.event.customFields }},
       user_id: {{ @user.id }}
     }
     ```

2. **Close Modal** → `event_modal`

3. **Fetch Collection** → `events_collection`
   - Force Refresh: `true`

4. **Set Variable** → `events_list`
   - Value: `{{ @events_collection }}`

5. **Show Notification** (opcional)
   - Type: Success
   - Message: "Evento criado com sucesso!"

---

#### **Workflow 5: On Event Update - Atualizar Evento Existente**

**Trigger**: `Calendar: Event Updated`

**Actions**:

1. **Supabase Update** → `events` table
   - Filter: `id` = `{{ trigger.event.id }}`
   - Mapping:
     ```javascript
     {
       title: {{ trigger.event.title }},
       description: {{ trigger.event.description }},
       date: {{ trigger.event.date }},
       start_time: {{ trigger.event.startTime }},
       end_time: {{ trigger.event.endTime }},
       shift_id: {{ trigger.event.shiftId }},
       color: {{ trigger.event.color }},
       custom_fields: {{ trigger.event.customFields }}
     }
     ```

2. **Close Modal** → `event_modal`

3. **Fetch Collection** → `events_collection`
   - Force Refresh: `true`

4. **Set Variable** → `events_list`
   - Value: `{{ @events_collection }}`

5. **Show Notification** (opcional)
   - Type: Success
   - Message: "Evento atualizado com sucesso!"

---

#### **Workflow 6: On Event Delete - Deletar Evento**

**Trigger**: `Calendar: Event Deleted`

**Actions**:

1. **Confirm Dialog** (opcional)
   - Message: "Tem certeza que deseja deletar este evento?"
   - If confirmed:

2. **Supabase Delete** → `events` table
   - Filter: `id` = `{{ trigger.eventId }}`

3. **Close Modal** → `event_modal`

4. **Fetch Collection** → `events_collection`
   - Force Refresh: `true`

5. **Set Variable** → `events_list`
   - Value: `{{ @events_collection }}`

6. **Show Notification** (opcional)
   - Type: Success
   - Message: "Evento deletado com sucesso!"

---

## 3. Guia de Vinculação de Dados

### 3.1 Propriedades Principais do Componente

#### **View Mode** (Modo de Visualização)
- **Binding**: Variável estática ou dinâmica
- **Valor**: `month` | `week` | `day`
- **Exemplo**: `month`

#### **Initial Date** (Data Inicial)
- **Binding**: `{{ @current_date }}`
- **Formato**: YYYY-MM-DD
- **Descrição**: Vincula à data atual do calendário

#### **Events** (Array de Eventos)
- **Binding**: `{{ @events_list }}`
- **Descrição**: Vincula à lista de eventos carregados

#### **Shifts** (Turnos de Trabalho)
- **Binding**: Array estático ou Collection
- **Exemplo**:
  ```javascript
  [
    {
      id: '1',
      name: 'Manhã',
      startTime: '08:00',
      endTime: '12:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      color: '#4CAF50',
      enabled: true
    },
    {
      id: '2',
      name: 'Tarde',
      startTime: '13:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      color: '#2196F3',
      enabled: true
    }
  ]
  ```

#### **Disabled Dates** (Datas Desabilitadas)
- **Binding**: Array de strings
- **Formato**: ['YYYY-MM-DD', ...]
- **Exemplo**: `['2025-12-25', '2025-01-01']`

#### **Custom Event Fields** (Campos Personalizados)
- **Binding**: Array de objetos
- **Exemplo**:
  ```javascript
  [
    {
      name: 'clientName',
      label: 'Nome do Cliente',
      type: 'text',
      required: true
    },
    {
      name: 'phone',
      label: 'Telefone',
      type: 'phone',
      required: true
    },
    {
      name: 'notes',
      label: 'Observações',
      type: 'textarea',
      required: false
    }
  ]
  ```

---

### 3.2 Mapeamento de Fórmulas (Events)

Se você usar uma Collection com estrutura diferente, configure as fórmulas de mapeamento:

#### **Events ID Formula**
- **Fórmula**: `item.id`
- **Descrição**: Mapeia o campo ID do evento

#### **Events Title Formula**
- **Fórmula**: `item.title`
- **Descrição**: Mapeia o título do evento

#### **Events Date Formula**
- **Fórmula**: `item.date`
- **Descrição**: Mapeia a data do evento (YYYY-MM-DD)

#### **Events Start Time Formula**
- **Fórmula**: `item.start_time`
- **Descrição**: Mapeia horário de início (HH:MM)

#### **Events End Time Formula**
- **Fórmula**: `item.end_time`
- **Descrição**: Mapeia horário de término (HH:MM)

#### **Events Color Formula**
- **Fórmula**: `item.color`
- **Descrição**: Mapeia a cor do evento

#### **Events Custom Fields Formula**
- **Fórmula**: `item.custom_fields`
- **Descrição**: Mapeia campos personalizados (JSON)

---

### 3.3 Mapeamento de Fórmulas (Shifts)

Se usar Collection para turnos:

#### **Shifts ID Formula**
- **Fórmula**: `item.id`

#### **Shifts Name Formula**
- **Fórmula**: `item.name`

#### **Shifts Start Time Formula**
- **Fórmula**: `item.start_time`

#### **Shifts End Time Formula**
- **Fórmula**: `item.end_time`

#### **Shifts Color Formula**
- **Fórmula**: `item.color`

#### **Shifts Days of Week Formula**
- **Fórmula**: `item.days_of_week`

---

### 3.4 Exemplo Completo de Binding no Componente

```javascript
{
  // Configurações Básicas
  viewMode: "month",
  initialDate: "{{ @current_date }}",
  locale: "pt-BR",
  firstDayOfWeek: 0,

  // Dados
  events: "{{ @events_list }}",
  shifts: [
    {
      id: "1",
      name: "Manhã",
      startTime: "08:00",
      endTime: "12:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      color: "#4CAF50",
      enabled: true
    },
    {
      id: "2",
      name: "Tarde",
      startTime: "13:00",
      endTime: "17:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      color: "#2196F3",
      enabled: true
    }
  ],

  // Configurações de Horário
  slotDuration: 30,
  displayStartHour: 8,
  displayEndHour: 18,
  timeFormat24h: true,

  // Campos Personalizados
  customEventFields: [
    {
      name: "clientName",
      label: "Nome do Cliente",
      type: "text",
      required: true
    },
    {
      name: "phone",
      label: "Telefone",
      type: "phone",
      required: true
    },
    {
      name: "notes",
      label: "Observações",
      type: "textarea",
      required: false
    }
  ],

  // Datas Desabilitadas
  disabledDates: ["2025-12-25", "2025-01-01"],

  // Interações
  allowEventClick: true,
  allowSlotClick: true,
  showWeekNumbers: true,
  showWeekends: true,

  // Estilo
  primaryColor: "#1967d2",
  backgroundColor: "#ffffff",
  borderColor: "#e0e0e0",
  textColor: "#202124",
  todayColor: "#e8f0fe",
  hoverColor: "#f1f3f4"
}
```

---

## 4. Funcionalidades para o Usuário Final

### 4.1 Navegação no Calendário

#### **Visualização Mensal**
- Exibe o mês completo em formato de grade
- Mostra eventos como blocos coloridos nos dias
- Permite navegação entre meses usando setas
- Destaca o dia atual com cor diferenciada
- Exibe números das semanas (se habilitado)

#### **Visualização Semanal**
- Mostra 7 dias com slots de horário
- Exibe eventos em timeline vertical
- Permite scroll para ver mais horários
- Mostra turnos disponíveis como fundo colorido

#### **Visualização Diária**
- Foco em um único dia
- Visualização detalhada de todos os slots
- Ideal para agendar múltiplos eventos no mesmo dia

---

### 4.2 Criação de Eventos

#### **Passo 1: Selecionar Data**
- Usuário clica em uma data disponível no calendário
- Datas desabilitadas (feriados) aparecem em cinza e não são clicáveis

#### **Passo 2: Modal de Evento**
- Modal abre automaticamente com a data pré-selecionada
- Formulário contém:
  - **Título** * (obrigatório)
  - **Descrição** (opcional)
  - **Data** * (pré-preenchida, editável)
  - **Horário de Início** * (obrigatório)
  - **Horário de Fim** * (obrigatório)
  - **Campos Personalizados** (conforme configuração)

#### **Passo 3: Seleção de Horário**
- Usuário seleciona horário de início e fim
- Sistema detecta automaticamente o turno disponível
- Cor do evento é atribuída automaticamente baseada no turno

#### **Passo 4: Validações Automáticas**
- **Título vazio**: "Por favor, preencha o título do evento"
- **Data vazia**: "Por favor, selecione uma data"
- **Horários vazios**: "Por favor, preencha os horários"
- **Horário inválido**: "O horário de início deve ser anterior ao horário de fim"
- **Turno indisponível**: "O horário selecionado não está disponível em nenhum turno configurado"
- **Conflito de horário**: "Já existe um evento '[título]' neste horário"

#### **Passo 5: Salvar Evento**
- Ao clicar em "Criar", evento é salvo no Supabase
- Modal fecha automaticamente
- Calendário atualiza mostrando o novo evento
- Notificação de sucesso (se configurada)

---

### 4.3 Edição de Eventos

#### **Passo 1: Clicar no Evento**
- Usuário clica em um evento existente no calendário

#### **Passo 2: Modal com Dados Preenchidos**
- Modal abre com todos os dados do evento
- Título muda para "Editar Evento"
- Todos os campos editáveis

#### **Passo 3: Modificar Dados**
- Usuário altera os campos desejados
- Mesmas validações da criação se aplicam

#### **Passo 4: Salvar Alterações**
- Ao clicar em "Salvar", evento é atualizado no Supabase
- Modal fecha automaticamente
- Calendário atualiza com as modificações

---

### 4.4 Exclusão de Eventos

#### **Opção 1: Botão Deletar no Modal**
- Ao editar um evento, botão "Deletar" aparece
- Ao clicar, confirmação é solicitada (se configurada)
- Evento é removido do Supabase
- Calendário atualiza removendo o evento

#### **Opção 2: Evento Programático**
- Workflow pode ser configurado para deletar via botão externo
- Útil para interfaces administrativas

---

### 4.5 Recursos Visuais

#### **Códigos de Cor**
- Eventos recebem automaticamente a cor do turno associado
- Facilita identificação visual de turnos diferentes
- Eventos sem turno usam cor primária padrão

#### **Indicadores de Turno**
- Fundo dos slots de horário mostra turnos disponíveis (se habilitado)
- Ajuda usuário a identificar horários disponíveis visualmente

#### **Hover States**
- Dias e slots mudam de cor ao passar o mouse
- Feedback visual de interatividade

#### **Estados de Data**
- **Hoje**: Fundo azul claro diferenciado
- **Dia com evento**: Badge com número de eventos
- **Dia desabilitado**: Fundo cinza, não clicável
- **Final de semana**: Pode ser ocultado se configurado

---

### 4.6 Responsividade e Acessibilidade

#### **Desktop**
- Calendário ocupa largura total disponível
- Visualização completa de todos os elementos

#### **Tablet**
- Ajuste automático de largura
- Botões e textos mantêm tamanho legível

#### **Mobile**
- Calendário adapta para tela menor
- Visualização semanal e diária recomendadas
- Modal ocupa tela completa

#### **Acessibilidade**
- Labels semânticos em todos os campos
- Campos obrigatórios marcados com *
- Mensagens de erro claras e diretas

---

## 5. Testes e Validação

### 5.1 Checklist de Testes Funcionais

#### **Carregamento Inicial**
- [ ] Calendário carrega na data atual
- [ ] Eventos do mês atual são exibidos
- [ ] Turnos são renderizados corretamente

#### **Criação de Evento**
- [ ] Clicar em data abre modal
- [ ] Data é pré-preenchida corretamente
- [ ] Campos obrigatórios são validados
- [ ] Horários inválidos são rejeitados
- [ ] Turno é detectado automaticamente
- [ ] Cor é atribuída baseada no turno
- [ ] Evento aparece no calendário após criação
- [ ] Dados são salvos corretamente no Supabase

#### **Edição de Evento**
- [ ] Clicar em evento abre modal de edição
- [ ] Dados são carregados corretamente
- [ ] Alterações são salvas no Supabase
- [ ] Calendário atualiza após edição

#### **Exclusão de Evento**
- [ ] Botão deletar funciona
- [ ] Confirmação é exibida (se configurada)
- [ ] Evento é removido do Supabase
- [ ] Calendário atualiza após exclusão

#### **Navegação**
- [ ] Setas avançam/retrocedem mês
- [ ] Eventos do novo mês são carregados
- [ ] Variáveis de ano/mês são atualizadas

#### **Validações**
- [ ] Conflitos de horário são detectados
- [ ] Horários fora de turno são rejeitados
- [ ] Datas desabilitadas não são clicáveis
- [ ] Campos obrigatórios são validados

#### **Campos Personalizados**
- [ ] Campos customizados aparecem no modal
- [ ] Validação de campos obrigatórios funciona
- [ ] Dados são salvos em custom_fields (JSONB)
- [ ] Dados são recuperados corretamente na edição

---

### 5.2 Testes de Performance

#### **Carregamento de Eventos**
- [ ] Calendário carrega < 100 eventos sem lag
- [ ] Filtragem por mês reduz carga
- [ ] Índices no Supabase melhoram queries

#### **Navegação entre Meses**
- [ ] Transição é suave
- [ ] Fetch ocorre apenas quando necessário
- [ ] Cache de dados (se configurado) funciona

---

### 5.3 Testes de Segurança

#### **RLS (Row Level Security)**
- [ ] Usuários veem apenas seus eventos
- [ ] Tentativa de acessar evento de outro usuário falha
- [ ] Criação sem user_id falha

#### **Validações Backend**
- [ ] Campos obrigatórios no Supabase
- [ ] Constraints de data/horário
- [ ] Proteção contra SQL injection (nativa no Supabase)

---

## 6. Troubleshooting

### 6.1 Problemas Comuns

#### **Eventos não aparecem no calendário**

**Possíveis causas**:
1. Collection não está carregando dados
2. Binding de `events` está incorreto
3. Filtro de RLS bloqueando dados
4. Formato de data incorreto

**Soluções**:
1. Verificar console do WeWeb para erros
2. Conferir binding: `{{ @events_list }}`
3. Revisar políticas RLS no Supabase
4. Garantir formato ISO: YYYY-MM-DD

---

#### **Modal não abre ao clicar em data**

**Possíveis causas**:
1. Workflow "On Day Click" não configurado
2. Modal não existe ou nome incorreto
3. Propriedade `allowSlotClick` desabilitada

**Soluções**:
1. Verificar trigger "Calendar: On Day Click"
2. Confirmar nome do modal: `event_modal`
3. Ativar `allowSlotClick: true`

---

#### **Evento não salva no Supabase**

**Possíveis causas**:
1. Mapeamento de campos incorreto
2. RLS bloqueando insert
3. `user_id` não está sendo passado
4. Campos obrigatórios faltando

**Soluções**:
1. Revisar action "Supabase Insert" no workflow
2. Verificar políticas RLS para INSERT
3. Garantir `user_id: {{ @user.id }}`
4. Validar que title, date, start_time, end_time estão preenchidos

---

#### **Conflito de horário não detectado**

**Possíveis causas**:
1. Validação desabilitada no componente
2. Função SQL não está funcionando
3. Formato de horário incorreto

**Soluções**:
1. Validação é feita no frontend automaticamente
2. Usar função `check_time_conflict()` se necessário validação backend
3. Garantir formato HH:MM (ex: 09:00, 14:30)

---

#### **Turno não detectado automaticamente**

**Possíveis causas**:
1. Array `shifts` vazio ou incorreto
2. Horário selecionado fora de todos os turnos
3. Dia da semana não incluído em `daysOfWeek`

**Soluções**:
1. Verificar binding de `shifts`
2. Conferir configuração de turnos
3. Garantir array `daysOfWeek` (0=Domingo, 6=Sábado)

---

#### **Campos personalizados não salvam**

**Possíveis causas**:
1. `customEventFields` não configurado
2. Formato JSON incorreto
3. Campo `custom_fields` não existe no Supabase

**Soluções**:
1. Configurar array `customEventFields`
2. Garantir que workflow passa: `custom_fields: {{ trigger.event.customFields }}`
3. Verificar coluna JSONB no Supabase

---

### 6.2 Debug Mode

#### **Habilitar Console Logs**

No `wwElement.vue`, você pode adicionar logs temporários:

```javascript
// No saveEvent()
console.log('Dados do evento:', eventData);

// No detectShift()
console.log('Turno detectado:', detectedShift);

// No validateEventData()
console.log('Validação:', modalEventData.value);
```

---

### 6.3 Suporte e Documentação

#### **Recursos Adicionais**

- **Documentação do Componente**: `ANALISE-PROJETO.md`
- **Guia de Reatividade**: `REATIVIDADE-DINAMICA.md`
- **Traduções PT-BR**: `TRADUCAO-PT-BR.md`
- **Supabase Docs**: https://supabase.com/docs
- **WeWeb Docs**: https://docs.weweb.io

---

## 📊 Resumo de Configuração Rápida

### Backend (Supabase)
1. ✅ Criar tabela `events` com SQL fornecido
2. ✅ Habilitar RLS e criar políticas
3. ✅ Criar função `update_updated_at_column()` + trigger
4. ✅ (Opcional) Criar funções `get_events_by_month()` e `check_time_conflict()`

### Frontend (WeWeb)
1. ✅ Criar 6 variáveis: `current_date`, `selected_event`, `events_list`, `selected_date`, `calendar_year`, `calendar_month`
2. ✅ Criar collection `events_collection` conectada ao Supabase
3. ✅ Configurar 6 workflows: Page Load, Month Navigation, Day Click, Event Create, Event Update, Event Delete
4. ✅ Adicionar componente Advanced Calendar à página
5. ✅ Configurar bindings de propriedades
6. ✅ Configurar turnos de trabalho
7. ✅ (Opcional) Configurar campos personalizados

---

## 🎯 Próximos Passos

Após implementação básica, considere:

1. **Notificações Push**: Lembrar usuários de eventos próximos
2. **Eventos Recorrentes**: Implementar lógica de recorrência
3. **Filtros Avançados**: Por turno, por status, por tipo
4. **Exportação**: Download de eventos em PDF/CSV
5. **Compartilhamento**: Permitir compartilhar eventos entre usuários
6. **Dashboard**: Estatísticas de agendamentos

---

**Documento criado em**: 23 de outubro de 2025
**Versão**: 1.0
**Idioma**: Português do Brasil (PT-BR)
**Componente**: Advanced Calendar WeWeb
**Backend**: Supabase PostgreSQL
