<template>
  <div class="advanced-calendar" :style="calendarStyles">
    <!-- Header Controls -->
    <div class="calendar-header">
      <div class="calendar-nav">
        <button
          class="nav-button"
          @click="navigateToday"
          :style="{ color: props.content?.primaryColor }"
        >
          {{ translations?.today || 'Today' }}
        </button>
        <button class="nav-button icon-button" @click="navigatePrev">
          &lt;
        </button>
        <button class="nav-button icon-button" @click="navigateNext">
          &gt;
        </button>
        <h2 class="current-period">{{ currentPeriodLabel }}</h2>
      </div>
      <div class="view-switcher">
        <button
          v-for="view in viewOptions"
          :key="view.value"
          class="view-button"
          :class="{ active: currentView === view.value }"
          :style="currentView === view.value ? { backgroundColor: props.content?.primaryColor, color: '#fff' } : {}"
          @click="changeView(view.value)"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <!-- Month View -->
    <div v-if="currentView === 'month'" class="month-view">
      <!-- Weekday Headers -->
      <div class="weekday-headers">
        <div
          v-for="(day, index) in weekdayHeaders"
          :key="index"
          class="weekday-header"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <div
          v-for="(day, index) in monthDays"
          :key="index"
          class="day-cell"
          :class="{
            'other-month': day.isOtherMonth,
            'today': day.isToday,
            'disabled': day.isDisabled,
            'weekend': day.isWeekend,
            'has-events': day.events?.length > 0
          }"
          :style="getDayCellStyle(day)"
          @click="handleDayClick(day)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div v-if="day.events?.length > 0" class="day-events">
            <div
              v-for="event in day.events.slice(0, 3)"
              :key="event.id"
              class="event-pill"
              :style="{ backgroundColor: event.color || props.content?.primaryColor }"
              @click.stop="handleEventClick(event)"
            >
              {{ event.title }}
            </div>
            <div v-if="day.events.length > 3" class="more-events">
              +{{ day.events.length - 3 }} {{ translations?.more || 'more' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Week View -->
    <div v-if="currentView === 'week'" class="week-view">
      <div class="week-grid">
        <!-- Time column -->
        <div class="time-column">
          <div class="time-header"></div>
          <div
            v-for="hour in displayHours"
            :key="hour"
            class="time-slot"
          >
            {{ formatHour(hour) }}
          </div>
        </div>

        <!-- Day columns -->
        <div
          v-for="(day, dayIndex) in weekDays"
          :key="dayIndex"
          class="day-column"
        >
          <div class="day-header" :class="{ 'today': day.isToday }">
            <div class="day-name">{{ day.dayName }}</div>
            <div class="day-date" :style="day.isToday ? { backgroundColor: props.content?.primaryColor, color: '#fff' } : {}">
              {{ day.dayNumber }}
            </div>
          </div>
          <div class="time-slots">
            <div
              v-for="slot in day.timeSlots"
              :key="slot.time"
              class="time-slot-cell"
              :class="{
                'available': slot.available,
                'occupied': slot.occupied,
                'disabled': slot.disabled
              }"
              :style="getSlotStyle(slot)"
              @click="handleSlotClick(day, slot)"
            >
              <div v-if="slot.event" class="slot-event" :style="{ backgroundColor: slot.event.color || props.content?.primaryColor }">
                {{ slot.event.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Day View -->
    <div v-if="currentView === 'day'" class="day-view">
      <div class="day-detail-grid">
        <!-- Time column -->
        <div class="time-column">
          <div
            v-for="hour in displayHours"
            :key="hour"
            class="time-slot"
          >
            {{ formatHour(hour) }}
          </div>
        </div>

        <!-- Day content -->
        <div class="day-content">
          <div class="time-slots">
            <div
              v-for="slot in dayTimeSlots"
              :key="slot.time"
              class="time-slot-cell"
              :class="{
                'available': slot.available,
                'occupied': slot.occupied,
                'disabled': slot.disabled
              }"
              :style="getSlotStyle(slot)"
              @click="handleSlotClick(currentDayData, slot)"
            >
              <div v-if="slot.event" class="slot-event" :style="{ backgroundColor: slot.event.color || props.content?.primaryColor }">
                <div class="event-title">{{ slot.event.title }}</div>
                <div class="event-time">{{ slot.event.startTime }} - {{ slot.event.endTime }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Modal -->
    <div v-if="showEventModal" class="modal-overlay" @click.self="closeEventModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ editingEvent ? 'Editar Evento' : 'Novo Evento' }}
          </h3>
          <button class="modal-close" @click="closeEventModal">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Event Title -->
          <div class="form-group">
            <label class="form-label">Título *</label>
            <input
              v-model="modalEventData.title"
              type="text"
              class="form-input"
              placeholder="Nome do evento"
            />
          </div>

          <!-- Event Description -->
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <textarea
              v-model="modalEventData.description"
              class="form-textarea"
              placeholder="Descrição do evento"
              rows="3"
            ></textarea>
          </div>

          <!-- Date and Time -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Data *</label>
              <input
                v-model="modalEventData.date"
                type="date"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Início *</label>
              <input
                v-model="modalEventData.startTime"
                type="time"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Fim *</label>
              <input
                v-model="modalEventData.endTime"
                type="time"
                class="form-input"
              />
            </div>
          </div>

          <!-- Custom Fields -->
          <div
            v-for="field in customEventFields"
            :key="field.id"
            class="form-group"
          >
            <label class="form-label">
              {{ field.name }}
              <span v-if="field.required">*</span>
            </label>
            <input
              v-if="field.type === 'text'"
              v-model="modalEventData.customFields[field.id]"
              type="text"
              class="form-input"
              :placeholder="field.placeholder || ''"
            />
            <textarea
              v-else-if="field.type === 'textarea'"
              v-model="modalEventData.customFields[field.id]"
              class="form-textarea"
              :placeholder="field.placeholder || ''"
              rows="3"
            ></textarea>
            <input
              v-else-if="field.type === 'number'"
              v-model.number="modalEventData.customFields[field.id]"
              type="number"
              class="form-input"
              :placeholder="field.placeholder || ''"
            />
            <input
              v-else-if="field.type === 'date'"
              v-model="modalEventData.customFields[field.id]"
              type="date"
              class="form-input"
            />
            <input
              v-else-if="field.type === 'email'"
              v-model="modalEventData.customFields[field.id]"
              type="email"
              class="form-input"
              :placeholder="field.placeholder || ''"
            />
            <input
              v-else-if="field.type === 'tel'"
              v-model="modalEventData.customFields[field.id]"
              type="tel"
              class="form-input"
              :placeholder="field.placeholder || ''"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEventModal">
            Cancelar
          </button>
          <button class="btn btn-primary" @click="saveEvent">
            {{ editingEvent ? 'Salvar' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
  isSameMonth,
  isToday,
  getDay,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  parse
} from 'date-fns';
import { ptBR, enUS, es, fr, de } from 'date-fns/locale';

export default {
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  setup(props, { emit }) {
    /* wwEditor:start */
    const isEditing = computed(() => props.wwEditorState?.isEditing || false);
    /* wwEditor:end */

    // ==================== INTERNAL VARIABLES ====================
    const { value: selectedDate, setValue: setSelectedDate } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'selectedDate',
      type: 'string',
      defaultValue: '',
    });

    const { value: selectedEvent, setValue: setSelectedEvent } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'selectedEvent',
      type: 'object',
      defaultValue: null,
    });

    const { value: availableSlots, setValue: setAvailableSlots } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'availableSlots',
      type: 'array',
      defaultValue: [],
    });

    const { value: currentViewVar, setValue: setCurrentViewVar } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'currentView',
      type: 'string',
      defaultValue: 'month',
    });

    // ==================== LOCAL STATE ====================
    const currentDate = ref(new Date());
    const internalViewMode = ref(props.content?.viewMode || 'month');

    // ==================== MODAL STATE ====================
    const showEventModal = ref(false);
    const editingEvent = ref(null);
    const modalEventData = ref({
      id: '',
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      customFields: {}
    });

    // ==================== COMPUTED PROPERTIES ====================

    // Current view mode
    const currentView = computed({
      get: () => internalViewMode.value,
      set: (val) => {
        internalViewMode.value = val;
        setCurrentViewVar(val);
      }
    });

    // Locale mapping
    const localeMap = {
      'pt-BR': ptBR,
      'en-US': enUS,
      'es-ES': es,
      'fr-FR': fr,
      'de-DE': de
    };

    const currentLocale = computed(() => {
      return localeMap[props.content?.locale] || ptBR;
    });

    // Translations
    const translations = computed(() => {
      const locale = props.content?.locale || 'pt-BR';
      const translations = {
        'pt-BR': { today: 'Hoje', more: 'mais' },
        'en-US': { today: 'Today', more: 'more' },
        'es-ES': { today: 'Hoy', more: 'más' },
        'fr-FR': { today: "Aujourd'hui", more: 'plus' },
        'de-DE': { today: 'Heute', more: 'mehr' }
      };
      return translations[locale] || translations['pt-BR'];
    });

    // Process shifts with formula mapping
    const processedShifts = computed(() => {
      const shifts = props.content?.shifts || [];
      const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

      return shifts.map(shift => {
        const id = resolveMappingFormula(props.content?.shiftsIdFormula, shift) ?? shift?.id;
        const name = resolveMappingFormula(props.content?.shiftsNameFormula, shift) ?? shift?.name;
        const startTime = resolveMappingFormula(props.content?.shiftsStartTimeFormula, shift) ?? shift?.startTime;
        const endTime = resolveMappingFormula(props.content?.shiftsEndTimeFormula, shift) ?? shift?.endTime;
        const color = resolveMappingFormula(props.content?.shiftsColorFormula, shift) ?? shift?.color;

        // Process daysOfWeek - can be string "1,2,3,4,5" or array [1,2,3,4,5]
        let daysOfWeek = shift?.daysOfWeek || '1,2,3,4,5';
        if (typeof daysOfWeek === 'string') {
          // Convert string "1,2,3,4,5" to array [1,2,3,4,5]
          daysOfWeek = daysOfWeek.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
        } else if (!Array.isArray(daysOfWeek)) {
          daysOfWeek = [1, 2, 3, 4, 5]; // default to weekdays
        }

        // Process dates - convert null to empty string
        const startDate = shift?.startDate || '';
        const endDate = shift?.endDate || '';

        return {
          id: id || `shift-${Date.now()}-${Math.random()}`,
          name: name || 'Turno sem nome',
          startTime: startTime || '09:00',
          endTime: endTime || '17:00',
          daysOfWeek: daysOfWeek,
          startDate: startDate || null,
          endDate: endDate || null,
          color: color || '#2196F3',
          enabled: shift?.enabled !== false,
          originalShift: shift
        };
      });
    });

    // Process events with formula mapping
    const processedEvents = computed(() => {
      const events = props.content?.events || [];
      const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

      return events.map(event => {
        const id = resolveMappingFormula(props.content?.eventsIdFormula, event) ?? event?.id;
        const title = resolveMappingFormula(props.content?.eventsTitleFormula, event) ?? event?.title;
        const date = resolveMappingFormula(props.content?.eventsDateFormula, event) ?? event?.date;
        const startTime = resolveMappingFormula(props.content?.eventsStartTimeFormula, event) ?? event?.startTime;
        const endTime = resolveMappingFormula(props.content?.eventsEndTimeFormula, event) ?? event?.endTime;

        return {
          id: id || `event-${Date.now()}-${Math.random()}`,
          title: title || 'Untitled Event',
          description: event?.description || '',
          date: date || '',
          startTime: startTime || '',
          endTime: endTime || '',
          shiftId: event?.shiftId || '',
          color: event?.color || '#1967d2',
          customFields: event?.customFields || {},
          originalEvent: event
        };
      });
    });

    // Disabled dates set
    const disabledDatesSet = computed(() => {
      const dates = props.content?.disabledDates || [];
      return new Set(dates);
    });

    // Custom event fields processed
    const customEventFields = computed(() => {
      return props.content?.customEventFields || [];
    });

    // View options
    const viewOptions = computed(() => {
      const locale = props.content?.locale || 'pt-BR';
      const labels = {
        'pt-BR': { month: 'Mês', week: 'Semana', day: 'Dia' },
        'en-US': { month: 'Month', week: 'Week', day: 'Day' },
        'es-ES': { month: 'Mes', week: 'Semana', day: 'Día' },
        'fr-FR': { month: 'Mois', week: 'Semaine', day: 'Jour' },
        'de-DE': { month: 'Monat', week: 'Woche', day: 'Tag' }
      };

      const currentLabels = labels[locale] || labels['pt-BR'];

      return [
        { value: 'month', label: currentLabels.month },
        { value: 'week', label: currentLabels.week },
        { value: 'day', label: currentLabels.day }
      ];
    });

    // Current period label
    const currentPeriodLabel = computed(() => {
      const view = currentView.value;
      const date = currentDate.value;
      const locale = currentLocale.value;

      if (view === 'month') {
        return format(date, 'MMMM yyyy', { locale });
      } else if (view === 'week') {
        const weekStart = startOfWeek(date, { weekStartsOn: props.content?.firstDayOfWeek || 0 });
        const weekEnd = endOfWeek(date, { weekStartsOn: props.content?.firstDayOfWeek || 0 });
        return `${format(weekStart, 'MMM d', { locale })} - ${format(weekEnd, 'MMM d, yyyy', { locale })}`;
      } else {
        return format(date, 'EEEE, MMMM d, yyyy', { locale });
      }
    });

    // Weekday headers
    const weekdayHeaders = computed(() => {
      const firstDay = props.content?.firstDayOfWeek || 0;
      const locale = currentLocale.value;
      const days = [];
      const baseDate = new Date(2025, 0, 5); // A Sunday

      for (let i = 0; i < 7; i++) {
        const dayIndex = (firstDay + i) % 7;
        const date = addDays(baseDate, dayIndex);
        days.push(format(date, 'EEE', { locale }));
      }

      return days;
    });

    // Month days for month view
    const monthDays = computed(() => {
      const date = currentDate.value;
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const firstDay = props.content?.firstDayOfWeek || 0;
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: firstDay });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: firstDay });

      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayOfWeek = getDay(day);
        const dayEvents = processedEvents.value.filter(e => e.date === dateStr);

        return {
          date: day,
          dateStr,
          dayNumber: format(day, 'd'),
          isOtherMonth: !isSameMonth(day, date),
          isToday: isToday(day),
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isDisabled: disabledDatesSet.value.has(dateStr) || !hasAvailableShift(day),
          events: dayEvents
        };
      });
    });

    // Week days for week view
    const weekDays = computed(() => {
      const date = currentDate.value;
      const firstDay = props.content?.firstDayOfWeek || 0;
      const weekStart = startOfWeek(date, { weekStartsOn: firstDay });
      const days = [];

      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dateStr = format(day, 'yyyy-MM-dd');
        const locale = currentLocale.value;

        days.push({
          date: day,
          dateStr,
          dayName: format(day, 'EEE', { locale }),
          dayNumber: format(day, 'd'),
          isToday: isToday(day),
          timeSlots: generateTimeSlots(day)
        });
      }

      return days;
    });

    // Current day data for day view
    const currentDayData = computed(() => {
      const day = currentDate.value;
      const dateStr = format(day, 'yyyy-MM-dd');
      const locale = currentLocale.value;

      return {
        date: day,
        dateStr,
        dayName: format(day, 'EEEE', { locale }),
        dayNumber: format(day, 'd'),
        isToday: isToday(day)
      };
    });

    // Day time slots for day view
    const dayTimeSlots = computed(() => {
      return generateTimeSlots(currentDate.value);
    });

    // Filtered time slots for week view (respecting display hours)
    const filteredWeekDays = computed(() => {
      return weekDays.value.map(day => ({
        ...day,
        timeSlots: day.timeSlots.filter(slot => {
          const hour = parseInt(slot.time.split(':')[0]);
          const startHour = props.content?.displayStartHour ?? 8;
          const endHour = props.content?.displayEndHour ?? 18;
          return hour >= startHour && hour <= endHour;
        })
      }));
    });

    // Filtered time slots for day view (respecting display hours)
    const filteredDayTimeSlots = computed(() => {
      return dayTimeSlots.value.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        const startHour = props.content?.displayStartHour ?? 8;
        const endHour = props.content?.displayEndHour ?? 18;
        return hour >= startHour && hour <= endHour;
      });
    });

    // Display hours (range of hours to show)
    const displayHours = computed(() => {
      const startHour = props.content?.displayStartHour ?? 8;
      const endHour = props.content?.displayEndHour ?? 18;

      const hours = [];
      for (let i = startHour; i <= endHour; i++) {
        hours.push(i);
      }
      return hours;
    });

    // Calendar styles
    const calendarStyles = computed(() => ({
      '--bg-color': props.content?.backgroundColor || '#ffffff',
      '--border-color': props.content?.borderColor || '#e0e0e0',
      '--text-color': props.content?.textColor || '#202124',
      '--today-color': props.content?.todayColor || '#e8f0fe',
      '--hover-color': props.content?.hoverColor || '#f1f3f4',
      '--primary-color': props.content?.primaryColor || '#1967d2',
      '--disabled-color': props.content?.disabledColor || '#f5f5f5',
      '--border-radius': props.content?.borderRadius || '8px'
    }));

    // ==================== HELPER FUNCTIONS ====================

    // Check if a date has any available shift
    function hasAvailableShift(date) {
      const dayOfWeek = getDay(date);
      const dateStr = format(date, 'yyyy-MM-dd');

      return processedShifts.value.some(shift => {
        if (!shift.enabled) return false;

        // Check day of week
        const daysArray = Array.isArray(shift.daysOfWeek) ? shift.daysOfWeek : [];
        if (!daysArray.includes(dayOfWeek)) return false;

        // Check date range with improved validation
        const hasStartDate = shift.startDate && shift.startDate !== '' && shift.startDate !== null;
        const hasEndDate = shift.endDate && shift.endDate !== '' && shift.endDate !== null;

        if (hasStartDate && dateStr < shift.startDate) return false;
        if (hasEndDate && dateStr > shift.endDate) return false;

        return true;
      });
    }

    // Generate time slots for a given day
    function generateTimeSlots(date) {
      const slots = [];
      const dateStr = format(date, 'yyyy-MM-dd');
      const slotDuration = props.content?.slotDuration || 30;
      const dayOfWeek = getDay(date);

      // Use displayStartHour and displayEndHour
      const startHour = props.content?.displayStartHour ?? 8;
      const endHour = props.content?.displayEndHour ?? 18;

      // Get shifts for this day
      const availableShifts = processedShifts.value.filter(shift => {
        if (!shift.enabled) return false;
        if (!shift.daysOfWeek?.includes(dayOfWeek)) return false;
        if (shift.startDate && shift.startDate !== '' && dateStr < shift.startDate) return false;
        if (shift.endDate && shift.endDate !== '' && dateStr > shift.endDate) return false;
        return true;
      });

      // Generate slots for configured hour range
      for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

          // Check if this time falls within any shift
          const inShift = availableShifts.some(shift => {
            return timeStr >= shift.startTime && timeStr < shift.endTime;
          });

          // Check if there's an event at this time - improved matching
          const slotTime = hour * 60 + minute;
          const event = processedEvents.value.find(e => {
            if (e.date !== dateStr) return false;

            // Convert to numeric comparison
            const eventStart = parseInt(e.startTime.split(':')[0]) * 60 + parseInt(e.startTime.split(':')[1]);
            const eventEnd = parseInt(e.endTime.split(':')[0]) * 60 + parseInt(e.endTime.split(':')[1]);

            // Check if slot is within event
            return slotTime >= eventStart && slotTime < eventEnd;
          });

          const isDisabled = disabledDatesSet.value.has(dateStr) || !inShift;

          slots.push({
            time: timeStr,
            available: !isDisabled && !event,
            occupied: !!event,
            disabled: isDisabled,
            event: event || null
          });
        }
      }

      return slots;
    }

    // Calculate available slots for a specific date
    function calculateAvailableSlots(date) {
      const timeSlots = generateTimeSlots(date);
      return timeSlots.filter(slot => slot.available).map(slot => slot.time);
    }

    // Format hour for display
    function formatHour(hour) {
      const is24h = props.content?.timeFormat24h !== false;
      if (is24h) {
        return `${String(hour).padStart(2, '0')}:00`;
      } else {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
      }
    }

    // Get day cell style
    function getDayCellStyle(day) {
      const styles = {};

      if (day.isToday) {
        styles.backgroundColor = props.content?.todayColor || '#e8f0fe';
      }

      if (day.isDisabled) {
        styles.backgroundColor = props.content?.disabledColor || '#f5f5f5';
        styles.opacity = '0.6';
        styles.cursor = 'not-allowed';
      }

      return styles;
    }

    // Get slot style
    function getSlotStyle(slot) {
      const styles = {};

      if (slot.disabled) {
        styles.backgroundColor = props.content?.disabledColor || '#f5f5f5';
        styles.cursor = 'not-allowed';
      }

      return styles;
    }

    // ==================== MODAL FUNCTIONS ====================

    function openEventModal({ date, time, shift } = {}) {
      // Reset modal data (shiftId e color serão detectados automaticamente ao salvar)
      modalEventData.value = {
        id: `event-${Date.now()}`,
        title: '',
        description: '',
        date: date || format(currentDate.value, 'yyyy-MM-dd'),
        startTime: time || '09:00',
        endTime: time ? addMinutesToTime(time, 60) : '10:00',
        customFields: {}
      };

      // Initialize custom fields
      customEventFields.value.forEach(field => {
        modalEventData.value.customFields[field.id] = '';
      });

      editingEvent.value = null;
      showEventModal.value = true;
    }

    function openEditEventModal(event) {
      // Parse customFields if string
      let customFields = {};
      if (typeof event.customFields === 'string') {
        try {
          customFields = JSON.parse(event.customFields);
        } catch (e) {
          customFields = {};
        }
      } else {
        customFields = event.customFields || {};
      }

      // shiftId e color não precisam ser exibidos no modal, serão detectados ao salvar
      modalEventData.value = {
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        customFields: { ...customFields }
      };

      editingEvent.value = event;
      showEventModal.value = true;
    }

    function closeEventModal() {
      showEventModal.value = false;
      editingEvent.value = null;
    }

    function addMinutesToTime(timeStr, minutes) {
      const [hours, mins] = timeStr.split(':').map(Number);
      const totalMinutes = hours * 60 + mins + minutes;
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMins = totalMinutes % 60;
      return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
    }

    function getShiftName(shiftId) {
      const shift = processedShifts.value.find(s => s.id === shiftId);
      return shift ? shift.name : '';
    }

    // Detecta automaticamente o turno baseado na data e horários
    function detectShift(date, startTime, endTime) {
      if (!date || !startTime || !endTime) return null;

      const dateObj = parseISO(date);
      const dayOfWeek = getDay(dateObj);
      const dateStr = format(dateObj, 'yyyy-MM-dd');

      // Encontra o turno que corresponde ao horário
      const matchingShift = processedShifts.value.find(shift => {
        if (!shift.enabled) return false;
        if (!shift.daysOfWeek?.includes(dayOfWeek)) return false;
        if (shift.startDate && shift.startDate !== '' && dateStr < shift.startDate) return false;
        if (shift.endDate && shift.endDate !== '' && dateStr > shift.endDate) return false;

        // Check if time is within shift
        return startTime >= shift.startTime && endTime <= shift.endTime;
      });

      return matchingShift || null;
    }

    function validateEventData() {
      if (!modalEventData.value.title) {
        alert('Por favor, preencha o título do evento');
        return false;
      }
      if (!modalEventData.value.date) {
        alert('Por favor, selecione uma data');
        return false;
      }
      if (!modalEventData.value.startTime || !modalEventData.value.endTime) {
        alert('Por favor, preencha os horários');
        return false;
      }
      if (modalEventData.value.startTime >= modalEventData.value.endTime) {
        alert('O horário de início deve ser anterior ao horário de fim');
        return false;
      }

      // Validate if time is within a shift
      const eventDate = modalEventData.value.date;
      const startTime = modalEventData.value.startTime;
      const endTime = modalEventData.value.endTime;

      const dateObj = parseISO(eventDate);
      const dayOfWeek = getDay(dateObj);

      const hasValidShift = processedShifts.value.some(shift => {
        if (!shift.enabled) return false;
        if (!shift.daysOfWeek?.includes(dayOfWeek)) return false;
        if (shift.startDate && shift.startDate !== '' && eventDate < shift.startDate) return false;
        if (shift.endDate && shift.endDate !== '' && eventDate > shift.endDate) return false;

        // Check if time is within shift
        return startTime >= shift.startTime && endTime <= shift.endTime;
      });

      if (!hasValidShift && processedShifts.value.length > 0) {
        alert('O horário selecionado não está disponível em nenhum turno configurado');
        return false;
      }

      // Validate no conflict with existing events (except when editing)
      const conflictingEvent = processedEvents.value.find(e => {
        // Ignore the event itself when editing
        if (editingEvent.value && e.id === editingEvent.value.id) return false;

        // Check time conflict on same day
        if (e.date !== eventDate) return false;

        // Check if there's time overlap
        return (startTime < e.endTime && endTime > e.startTime);
      });

      if (conflictingEvent) {
        alert(`Já existe um evento "${conflictingEvent.title}" neste horário`);
        return false;
      }

      // Validate custom required fields
      for (const field of customEventFields.value) {
        if (field.required && !modalEventData.value.customFields[field.id]) {
          alert(`Por favor, preencha o campo obrigatório: ${field.name}`);
          return false;
        }
      }

      return true;
    }

    function saveEvent() {
      if (!validateEventData()) return;

      // Detectar turno automaticamente baseado nos horários
      const detectedShift = detectShift(
        modalEventData.value.date,
        modalEventData.value.startTime,
        modalEventData.value.endTime
      );

      // Preparar dados do evento
      const eventData = {
        id: modalEventData.value.id,
        title: modalEventData.value.title,
        description: modalEventData.value.description,
        date: modalEventData.value.date,
        startTime: modalEventData.value.startTime,
        endTime: modalEventData.value.endTime,
        shiftId: detectedShift?.id || '',
        color: detectedShift?.color || props.content?.primaryColor || '#1967d2',
        customFields: JSON.stringify(modalEventData.value.customFields)
      };

      if (editingEvent.value) {
        // Update existing event
        emit('trigger-event', {
          name: 'event-update',
          event: {
            ...eventData,
            previousEventId: editingEvent.value.id
          }
        });
      } else {
        // Create new event
        emit('trigger-event', {
          name: 'event-create',
          event: eventData
        });
      }

      closeEventModal();
    }

    // Close modal with ESC key
    function handleKeyDown(event) {
      if (event.key === 'Escape' && showEventModal.value) {
        closeEventModal();
      }
    }

    // Add/remove event listener
    watch(showEventModal, (isOpen) => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
      } else {
        document.removeEventListener('keydown', handleKeyDown);
      }
    });

    // ==================== NAVIGATION ====================

    function navigateToday() {
      currentDate.value = new Date();
      emit('trigger-event', {
        name: 'navigation',
        event: {
          direction: 'today',
          currentDate: format(currentDate.value, 'yyyy-MM-dd'),
          view: currentView.value
        }
      });
    }

    function navigatePrev() {
      const view = currentView.value;
      if (view === 'month') {
        currentDate.value = subMonths(currentDate.value, 1);
      } else if (view === 'week') {
        currentDate.value = subWeeks(currentDate.value, 1);
      } else {
        currentDate.value = subDays(currentDate.value, 1);
      }

      emit('trigger-event', {
        name: 'navigation',
        event: {
          direction: 'prev',
          currentDate: format(currentDate.value, 'yyyy-MM-dd'),
          view: currentView.value
        }
      });
    }

    function navigateNext() {
      const view = currentView.value;
      if (view === 'month') {
        currentDate.value = addMonths(currentDate.value, 1);
      } else if (view === 'week') {
        currentDate.value = addWeeks(currentDate.value, 1);
      } else {
        currentDate.value = addDays(currentDate.value, 1);
      }

      emit('trigger-event', {
        name: 'navigation',
        event: {
          direction: 'next',
          currentDate: format(currentDate.value, 'yyyy-MM-dd'),
          view: currentView.value
        }
      });
    }

    function changeView(view) {
      internalViewMode.value = view;
      setCurrentViewVar(view);

      emit('trigger-event', {
        name: 'view-change',
        event: {
          view: view,
          date: format(currentDate.value, 'yyyy-MM-dd')
        }
      });
    }

    // ==================== EVENT HANDLERS ====================

    function handleDayClick(day) {
      if (day.isDisabled) return;

      const dateStr = day.dateStr;
      setSelectedDate(dateStr);

      const slots = calculateAvailableSlots(day.date);
      setAvailableSlots(slots);

      // Open modal for event creation
      openEventModal({ date: dateStr });

      emit('trigger-event', {
        name: 'date-select',
        event: {
          date: dateStr,
          availableSlots: slots,
          dayOfWeek: getDay(day.date)
        }
      });
    }

    function handleEventClick(event) {
      if (!props.content?.allowEventClick) return;

      setSelectedEvent(event);

      // Open modal for event editing
      openEditEventModal(event);

      emit('trigger-event', {
        name: 'event-click',
        event: {
          event: event,
          date: event.date,
          time: event.startTime
        }
      });
    }

    function handleSlotClick(day, slot) {
      if (!props.content?.allowSlotClick) return;
      if (slot.disabled) return;

      // Find the shift for this slot
      const dayOfWeek = getDay(day.date);
      const shift = processedShifts.value.find(s => {
        return s.enabled &&
               s.daysOfWeek?.includes(dayOfWeek) &&
               slot.time >= s.startTime &&
               slot.time < s.endTime;
      });

      // Open modal for event creation with time and shift
      if (slot.available) {
        openEventModal({ date: day.dateStr, time: slot.time, shift });
      }

      emit('trigger-event', {
        name: 'slot-click',
        event: {
          date: day.dateStr,
          time: slot.time,
          shift: shift || {},
          available: slot.available
        }
      });
    }

    // ==================== WATCHERS ====================

    // Watch for initial date changes
    watch(() => props.content?.initialDate, (newDate) => {
      if (newDate) {
        try {
          const parsed = parseISO(newDate);
          if (isValid(parsed)) {
            currentDate.value = parsed;
          }
        } catch (e) {
          console.warn('Data inicial inválida:', newDate);
        }
      }
    }, { immediate: true });

    // Watch ALL properties that affect rendering
    watch(() => [
      props.content?.viewMode,
      props.content?.shifts,
      props.content?.events,
      props.content?.disabledDates,
      props.content?.customEventFields,
      props.content?.locale,
      props.content?.firstDayOfWeek,
      props.content?.slotDuration,
      props.content?.displayStartHour,
      props.content?.displayEndHour,
      props.content?.showWeekNumbers,
      props.content?.showWeekends,
      props.content?.timeFormat24h,
      props.content?.allowEventClick,
      props.content?.allowSlotClick,
      props.content?.showShiftIndicators,
      props.content?.dateInputFormat,
      // Style properties (reactive via calendarStyles computed)
      props.content?.backgroundColor,
      props.content?.borderColor,
      props.content?.textColor,
      props.content?.todayColor,
      props.content?.hoverColor,
      props.content?.primaryColor,
      props.content?.disabledColor,
      props.content?.borderRadius,
      // Formula properties
      props.content?.shiftsIdFormula,
      props.content?.shiftsNameFormula,
      props.content?.shiftsStartTimeFormula,
      props.content?.shiftsEndTimeFormula,
      props.content?.shiftsColorFormula,
      props.content?.eventsIdFormula,
      props.content?.eventsTitleFormula,
      props.content?.eventsDateFormula,
      props.content?.eventsStartTimeFormula,
      props.content?.eventsEndTimeFormula,
    ], () => {
      // Properties are reactive through computed properties
      // This watcher ensures any side effects are handled
    }, { deep: true });

    // Watch for external viewMode changes
    watch(() => props.content?.viewMode, (newMode) => {
      if (newMode && newMode !== internalViewMode.value) {
        internalViewMode.value = newMode;
      }
    }, { immediate: true });

    // Sync currentView with internal variable
    watch(currentView, (newView) => {
      setCurrentViewVar(newView);
    }, { immediate: true });

    return {
      props,
      currentView,
      currentPeriodLabel,
      viewOptions,
      weekdayHeaders,
      monthDays,
      weekDays: filteredWeekDays,
      currentDayData,
      dayTimeSlots: filteredDayTimeSlots,
      displayHours,
      calendarStyles,
      translations,
      navigateToday,
      navigatePrev,
      navigateNext,
      changeView,
      handleDayClick,
      handleEventClick,
      handleSlotClick,
      formatHour,
      getDayCellStyle,
      getSlotStyle,
      // Modal
      showEventModal,
      editingEvent,
      modalEventData,
      openEventModal,
      openEditEventModal,
      closeEventModal,
      saveEvent,
      customEventFields,
      /* wwEditor:start */
      isEditing,
      processedShifts,
      processedEvents,
      disabledDatesSet,
      /* wwEditor:end */
    };
  }
};
</script>

<style lang="scss" scoped>
.advanced-calendar {
  width: 100%;
  min-height: 400px;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: var(--text-color);
}

// ==================== HEADER ====================
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-button {
  background: none;
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--hover-color);
  }

  &.icon-button {
    padding: 8px 12px;
    font-size: 16px;
  }
}

.current-period {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-color);
}

.view-switcher {
  display: flex;
  gap: 8px;
}

.view-button {
  background: none;
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--hover-color);
  }

  &.active {
    background-color: var(--primary-color);
    color: #fff;
    border-color: var(--primary-color);
  }
}

// ==================== MONTH VIEW ====================
.month-view {
  width: 100%;
}

.weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday-header {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #5f6368;
  text-transform: uppercase;
  padding: 8px 4px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: var(--border-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.day-cell {
  background-color: var(--bg-color);
  min-height: 90px;
  padding: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;

  &:hover:not(.disabled) {
    background-color: var(--hover-color);
  }

  &.other-month {
    opacity: 0.5;
  }

  &.today {
    background-color: var(--today-color);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.weekend {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-pill {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 4px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.2s ease;
  line-height: 1.2;

  &:hover {
    opacity: 0.8;
  }
}

.more-events {
  font-size: 11px;
  color: #5f6368;
  margin-top: 2px;
}

// ==================== WEEK VIEW ====================
.week-view {
  width: 100%;
  overflow-x: auto;
}

.week-grid {
  display: grid;
  grid-template-columns: 70px repeat(7, 1fr);
  min-width: 800px;
}

.time-column {
  border-right: 1px solid var(--border-color);
}

.time-header {
  height: 50px;
  border-bottom: 1px solid var(--border-color);
}

.time-slot {
  height: 45px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 4px 8px;
  font-size: 12px;
  color: #5f6368;
  border-bottom: 1px solid var(--border-color);
}

.day-column {
  border-right: 1px solid var(--border-color);

  &:last-child {
    border-right: none;
  }
}

.day-header {
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
  gap: 4px;

  &.today {
    background-color: var(--today-color);
  }
}

.day-name {
  font-size: 12px;
  font-weight: 600;
  color: #5f6368;
  text-transform: uppercase;
}

.day-date {
  font-size: 18px;
  font-weight: 500;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.time-slots {
  display: flex;
  flex-direction: column;
}

.time-slot-cell {
  height: 45px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;

  &:hover:not(.disabled) {
    background-color: var(--hover-color);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &.occupied {
    cursor: default;
  }
}

.slot-event {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border-radius: 4px;
  padding: 4px 6px;
  color: #fff;
  font-size: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
}

// ==================== DAY VIEW ====================
.day-view {
  width: 100%;
  overflow-x: auto;
}

.day-detail-grid {
  display: grid;
  grid-template-columns: 80px 1fr;
  min-width: 600px;
}

.day-content {
  border-left: 1px solid var(--border-color);
}

.event-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.event-time {
  font-size: 11px;
  opacity: 0.9;
}

// ==================== MODAL ====================
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-color);
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #5f6368;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--hover-color);
  }
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 8px;

  span {
    color: #d93025;
  }
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: inherit;
  color: var(--text-color);
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(25, 103, 210, 0.1);
  }

  &::placeholder {
    color: #9aa0a6;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-input-color {
  width: 60px;
  height: 40px;
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }
}

.btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background-color: var(--primary-color);
  color: #fff;

  &:hover:not(:disabled) {
    background-color: #1557b0;
  }
}

.btn-secondary {
  background-color: #fff;
  color: var(--text-color);
  border: 1px solid var(--border-color);

  &:hover:not(:disabled) {
    background-color: var(--hover-color);
  }
}

// ==================== RESPONSIVE ====================
@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .view-switcher {
    width: 100%;
    justify-content: stretch;

    .view-button {
      flex: 1;
    }
  }

  .day-cell {
    min-height: 80px;
    padding: 4px;
  }

  .event-pill {
    font-size: 10px;
  }

  .current-period {
    font-size: 16px;
  }

  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
