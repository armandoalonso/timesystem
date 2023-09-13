const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'Decemeber'];
const PHASES = ['Dawn', 'Morning', 'Noon', 'Afternoon', 'Day', 'Dusk', 'Night', 'Midnight', 'Late Night'];
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter']

function getInstanceJs(parentClass, scriptInterface, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);

      this.enabled = false;

      this.tickTimer = 0;
      this.tickCounter = 0;

      this.tickRate = 1;       // how many seconds between each tick
      this.ticksPer = 5;

      this.currentTick = 0;
      this.currentMinute = 0;
      this.currentHour = 0;
      this.currentDay = 1;
      this.currentWeek = 1;
      this.currentDayinWeek = 1;
      this.currentMonth = 1;
      this.currentYear = 0;
      this.phaseMode = 0;
      this.currentPhase = PHASES[4];
      this.currentSeason = SEASONS[0];

      this.alarms = {};
      this.dateTriggers = {};
      this.monthlyTriggers = {};
      this.yearlyTrigger = {};

      if (properties) {
        this.enabled = properties[0];
        this.tickRate = properties[1];
        this.tickDurationType = properties[2];
        this.ticksPer = properties[3];

        this.currentMinute = properties[4];
        this.currentHour = properties[5];
        this.currentDay = properties[6];
        this.currentMonth = properties[7];
        this.currentYear = properties[8];
        this.currentDayinWeek = properties[9];
        this.phaseMode = properties[10];
      }

      this.Init();

      if(this.enabled){
        this.StartTickSystem();
      }
    }

    Init() {
      this.currentWeek = this.CalculateCurrentWeek();
    }

    // ACTIONS ------------------------------------

    StartTickSystem() {
      this._StartTicking();
      this.enabled = true;
    }

    StopTickSystem() {
      this._StopTicking();
      this.enabled = false;
    }

    SetTickRate(rate) {
      this.tickRate = rate;
    }

    SetTicksDuration(ticks, durationType) {
      this.ticksPer = ticks;
      this.tickDurationType = durationType;
    }

    SetDate(day, month, year) {
      const current = new Date(this.currentYear, this.currentMonth, this.currentDay);
      const newDate = new Date(year, month, day);
      const diffTime = Math.abs(newDate - current);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      this.currentDayinWeek = (this.currentDayinWeek + diffDays) % 7;
      this.currentDay = day;
      this.currentMonth = month;
      this.currentYear = year;
      this.currentWeek = this.CalculateCurrentWeek();
      
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
      this.CheckSeasonChange();
    }

    SetTime(hour, minute, ampm) {
      if(ampm === 1){
        hour += 12;
      }
      this.currentHour = hour;
      this.currentMinute = minute;
      
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
    }

    SetDateTime(day, month, year, hour, minute, ampm) {
      const current = new Date(this.currentYear, this.currentMonth, this.currentDay);
      const newDate = new Date(year, month, day);
      const diffTime = Math.abs(newDate - current);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      this.currentDayinWeek = (this.currentDayinWeek + diffDays) % 7;
      this.currentDay = day;
      this.currentMonth = month;
      this.currentYear = year;
      this.currentWeek = this.CalculateCurrentWeek();

      if(ampm === 1){
        hour += 12;
      }
      this.currentHour = hour;
      this.currentMinute = minute;

      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
      this.CheckSeasonChange();
    }

    AddDateTime(mintues, hours, days, months, years) {
      // monthIndex = 0-11 so -1 is applied to currentMonth
      const current = new Date(this.currentYear, this.currentMonth-1, this.currentDay, this.currentHour, this.currentMinute);
      let milliseconds = mintues * 60 * 1000;
      milliseconds += hours * 60 * 60 * 1000;
      milliseconds += days * 24 * 60 * 60 * 1000;
      milliseconds += months * 30 * 24 * 60 * 60 * 1000;
      milliseconds += years * 365 * 24 * 60 * 60 * 1000;
      const newDate = new Date(current.getTime() + milliseconds);
      
      this.currentDayinWeek = (this.currentDayinWeek + days) % 7;
      this.currentWeek = this.CalculateCurrentWeek();

      this.currentDay = newDate.getDate();
      this.currentMonth = newDate.getMonth()+1;
      this.currentYear = newDate.getFullYear();
      this.currentHour = newDate.getHours();
      this.currentMinute = newDate.getMinutes();

      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
      this.CheckSeasonChange();
    }

    SetAlarm(tag, hour, minute, ampm, repeat) {
      this.alarms[tag] = {
        hour: hour,
        minute: minute,
        ampm: ampm,
        repeat: repeat,
      };
    }

    SetDateTrigger(tag, day, month, year) {
      this.dateTriggers[tag] = {
        day: day,
        month: month,
        year: year,
      };
    }

    RemoveDateTrigger(tag) {
      delete this.dateTriggers[tag];
    }

    SetMonthlyTrigger(tag, day) {
      this.monthlyTriggers[tag] = {
        day: day,
      };
    }

    RemoveMonthlyTrigger(tag) {
      delete this.monthlyTriggers[tag];
    }

    SetYearlyTrigger(tag, day, month) {
      this.yearlyTrigger[tag] = {
        day: day,
        month: month,
      };
    }

    RemoveYearlyTrigger(tag) {
      delete this.yearlyTrigger[tag];
    }

    NextHour() {
      this.currentHour++;
      this.ProcessHour();
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
    }

    NextDay() {
      this.currentDay++;
      this.currentDayinWeek++;
      this.ProcessDay();
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
    }

    NextMonth() {
      this.currentMonth++;
      this.ProcessMonth();
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
      this.CheckSeasonChange();
    }

    NextYear() {
      this.currentYear++;
      this.ProcessYear();
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
      this.CheckSeasonChange();
    }

    NextDayPhase(phase) {
      const currentHour = this.currentHour;
      const nextPhaseHour = this.GetPhaseStartHour(phase);

      if(currentHour < nextPhaseHour){
        this.currentHour = nextPhaseHour;
        this.ProcessHour();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
        this.CheckPhaseChange();
      }else{
        this.currentHour = nextPhaseHour;
        this.ProcessHour();
        this.NextDay();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
        this.CheckPhaseChange();
      }
    }

    NextSeason() {
      const currentSeason = this.currentSeason;
      const currentSeasonIndex = SEASONS.indexOf(currentSeason);
      const nextSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
      let nextMonth = 0;
      
      switch(nextSeasonIndex) {
        case 0: // Spring
          nextMonth = 3;
          break;
        case 1: // Summer
          nextMonth = 6;
          break;
        case 2: // Autumn
          nextMonth = 9;
          break;
        case 3: // Winter
          nextMonth = 12;
          break;
      }

      this.SetDate(1, nextMonth, this.currentYear);
    }

    SetDayOfWeek(day) {
      this.currentDayinWeek = day;
    }

    LoadJson(json) {
      const o = JSON.parse(json);
      this.LoadFromJson(o);
    }

    // CONDITIONS ------------------------------------

    IsEnabled() {
      return this.enabled;
    }

    IsDayPhase(phase) {
      return this.currentPhase == PHASES[phase];
    }

    IsSeason(season) {
      return this.currentSeason == SEASONS[season];
    }

    IsDateTime(day, month, year, hour, minute, ampm) {
      if(ampm === 1){
        hour += 12;
      }
      return this.currentDay === day && this.currentMonth === month && this.currentYear === year && this.currentHour === hour && this.currentMinute === minute;
    }

    IsDate(day, month, year) {
      return this.currentDay === day && this.currentMonth === month && this.currentYear === year;
    }

    IsTime(hour, minute, ampm) {
      if(ampm === 1){
        hour += 12;
      }
      return this.currentHour === hour && this.currentMinute === minute;
    }

    IsHour(hour) {
      return this.currentHour === hour;
    }

    IsDay(day) {
      return this.currentDay === day;
    }

    IsDayOfWeek(day) {
      return this.currentDayinWeek === DAYS.indexOf(day);
    }

    IsMonth(month) {
      return this.currentMonth === month;
    }

    OnAlarm(tag) {
      const alarm = this.alarms[tag];
      if(alarm){
        if(this.IsTime(alarm.hour, alarm.minute, alarm.ampm)){
          if(!alarm.repeat){
            delete this.alarms[tag];
          }
          return true;
        }
      }
      return false;
    }

    RemoveAlarm(tag) {
      delete this.alarms[tag];
    }

    OnDateTrigger(tag) {
      const dateTrigger = this.dateTriggers[tag];
      if(dateTrigger){
        if(this.IsDate(dateTrigger.day, dateTrigger.month, dateTrigger.year)){
          delete this.dateTriggers[tag];
          return true;
        }
      }
      return false;
    }

    OnMonthlyTrigger(tag) {
      const monthlyTrigger = this.monthlyTriggers[tag];
      if(monthlyTrigger){
        if(this.IsDay(monthlyTrigger.day)){
          return true;
        }
      }
      return false;
    }

    OnYearlyTrigger(tag) {
      const yearlyTrigger = this.yearlyTrigger[tag];
      if(yearlyTrigger){
        if(this.IsDate(yearlyTrigger.day, yearlyTrigger.month, this.currentYear)){
          return true;
        }
      }
      return false;
    }

    // EXPRESSIONS ------------------------------------

    DayFullName() {
      return DAYS[this.currentDayinWeek];
    }

    DayShortName() {
      return DAYS[this.currentDayinWeek].substring(0, 3);
    }

    MonthFullName() {
      return MONTHS[this.currentMonth-1];
    }

    MonthShortName() {
      return MONTHS[this.currentMonth-1].substring(0, 3);
    }

    Time24() {
      return `${this.currentHour.toString().padStart(2, '0')}:${this.currentMinute.toString().padStart(2, '0')}`;
    }

    Time12() {
      let hour = this.currentHour % 12;
      if (hour === 0) {
        hour = 12;
      }
      const ampm = this.currentHour < 12 ? 'am' : 'pm';
      return `${hour.toString().padStart(2, '0')}:${this.currentMinute.toString().padStart(2, '0')} ${ampm}`;
    }

    // PRIVATE ------------------------------------

    GetPhaseStartHour(phase) {
      switch (phase) {
        case 0: // dawn
          return 5;
        case 1: // morning
          return 8;
        case 3: // afternoon
          return 12;
        case 4: // day
          return 17;
        case 5: // dusk
          return 20;
        case 6: // night
          return 22;
        default: // late night
          return 1;
      }
    }

    GetTimeSpanInMilliseconds(mintue, hour, day, month, year) {
      const current = new Date(this.currentYear, this.currentMonth-1, this.currentDay, this.currentHour, this.currentMinute);
      const newDate = new Date(year, month-1, day, hour, mintue); 
      return newDate.getTime() - current.getTime();
    }

    GetMaxDaysMonth(month) {
      switch (month) {
        case 2:
          return (this.currentYear % 4 === 0 && (this.currentYear % 100 !== 0 || this.currentYear % 400 === 0)) ? 29 : 28;
        case 4:
        case 6:
        case 9:
        case 11:
          return 30;
        default:
          return 31;
      }
    }

    CalculateCurrentWeek() {
      let daysSinceFirstDay = this.currentDay;
      for (let i = 1; i < this.currentMonth; i++) {
        daysSinceFirstDay += this.GetMaxDaysMonth(i);
      }
      const daysUntilFirstWeek = 7 - ((this.currentDayinWeek + daysSinceFirstDay - 1) % 7);
      const currentWeek = Math.ceil((daysSinceFirstDay - daysUntilFirstWeek) / 7) + 1;
      return currentWeek;
    }

    Tick() {
      this.tickTimer += this._runtime.GetDt();
      if(this.tickTimer > this.tickRate){
        this.currentTick++;
        this.tickTimer = 0;
        this.ProcessTick();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnTick);
      }
    }

    ProcessTick() {
      this.tickCounter++;
      if(this.tickCounter >= this.ticksPer){
        this.tickCounter = 0;
        switch (this.tickDurationType) {
          case 0: // per minute
              this.currentMinute++;
              this.ProcessMinute();
              this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnMinute);
              this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
            break;
          case 1: // per hour
            this.currentHour++
            this.ProcessHour();
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnHour);
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
            break;
          case 2: // per day
            this.currentDay++;
            this.currentDayinWeek++;
            this.ProcessDay();
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDay);
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
            break;
          case 3: // per month
            this.currentMonth++;
            this.ProcessMonth();
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnMonth);
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
            break;
          case 4: // per year 
            this.currentYear++;
            this.ProcessYear();
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnYear);
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
            break;
        }
      }
    }

    ProcessMinute() {
      if(this.currentMinute >= 60){
        this.currentMinute = 0;
        this.currentHour++;
        this.ProcessHour();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnHour);
        this.CheckPhaseChange();
      }
    }

    ProcessHour() {
      if(this.currentHour >= 24){
        this.currentHour = 0;
        this.currentDay++;
        this.currentDayinWeek++;
        this.ProcessDay();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDay);
      }
    }

    ProcessDay() {
      if(this.currentDayinWeek >= 7){
        this.currentDayinWeek = 0;
        this.currentWeek++;
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnWeek);
      }

      if(this.currentDay > this.GetMaxDaysMonth(this.currentMonth)){
        this.currentDay = 0;
        this.currentMonth++;
        this.ProcessMonth();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnMonth);
        this.CheckSeasonChange();
      }
    }

    ProcessMonth() {
      if(this.currentMonth > 12){
        this.currentMonth = 1;
        this.currentWeek = 1
        this.currentYear++;
        this.ProcessYear();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnYear);
      }
    }

    ProcessYear() {
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnNewYear);
    }

    CheckSeasonChange() {
      const previousSeason = this.currentSeason;
      switch (this.currentMonth) {
        case 12: // December
        case 1:  // January
        case 2:  // Febuary
          this.currentSeason = SEASONS[3]; // Winter
          break;
        case 3: // March
        case 4: // April
        case 5: // May
          this.currentSeason = SEASONS[0]; // Spring
          break;
        case 6: // June
        case 7: // July
        case 8: // August
          this.currentSeason = SEASONS[1]; // Summer
          break;
        case 9:  // September
        case 10: // October
        case 11: // November
          this.currentSeason = SEASONS[2]; // Autumn
          break;
      }
      if(previousSeason !== this.currentSeason){
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnSeasonChanged);
      }
    }

    CheckPhaseChange() {
      // at this point current hour has increased by 1
      // check if phase has changed by comapring current hour to previous hour
      let previousPhase = this.currentPhase;

      switch (this.phaseMode) {
        case 0: // 2 phases
          this.currentPhase = this.GetDayPhaseTwo();
          if(previousPhase !== this.currentPhase){
            this.currentPhase = this.currentPhase;
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDayPhaseChange);
          }
          break;
        case 1: // 4 phases
          this.currentPhase = this.GetDayPhaseFour();
          if(previousPhase !== this.currentPhase){
            this.currentPhase = this.currentPhase;
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDayPhaseChange);
          }
          break;
        case 2: // 6 phases
          this.currentPhase = this.GetDayPhaseSix();
          if(previousPhase !== this.currentPhase){
            this.currentPhase = this.currentPhase;
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDayPhaseChange);
          }
          break;
        case 3: // 8 phases
          this.currentPhase = this.GetDayPhaseEight();
          if(previousPhase !== this.currentPhase){
            this.currentPhase = this.currentPhase;
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDayPhaseChange);
          }  
          break
      }
    }

    GetDayPhaseTwo(modifier = 0) {
      const hour = this.currentHour + modifier;
      if(hour >= 6 && hour < 18){
        return PHASES[4]; // Day
      }else{
        return PHASES[6]; // Night
      }
    }

    GetDayPhaseFour(modifier = 0) {
      const hour = this.currentHour + modifier;
      if(hour >= 6 && hour < 12){
        return PHASES[1]; // Morning
      }else if(hour >= 12 && hour < 18){
        return PHASES[3]; // Afternoon
      }else if(hour >= 18 && hour < 24){
        return PHASES[6]; // Night
      }else{
        return PHASES[8]; // Late Night
      }
    }

    GetDayPhaseSix(modifier = 0) {
      const hour = this.currentHour + modifier;
      if(hour >= 5 && hour < 8){
        return PHASES[0]; // Dawn
      }else if(hour >= 8 && hour < 12){
        return PHASES[1]; // Morning
      }else if(hour >= 12 && hour < 17){
        return PHASES[3]; // Afternoon
      }else if(hour >= 17 && hour < 20){
        return PHASES[5]; // Dusk
      }else if(hour >= 20 && hour < 24){
        return PHASES[6]; // Night
      }else{
        return PHASES[8]; // Late Night
      }
    }

    AsJson() {
      return JSON.stringify(this.SaveToJson());
    }

    // C3 ------------------------------------

    Release() {
      super.Release();
    }

    SaveToJson() {
      return {
        "enabled": this.enabled,
        "tickRate": this.tickRate,
        "tickDurationType": this.tickDurationType,
        "ticksPer": this.ticksPer,
        "currentMinute": this.currentMinute,
        "currentHour": this.currentHour,
        "currentDay": this.currentDay,
        "currentMonth": this.currentMonth,
        "currentYear": this.currentYear,
        "currentDayinWeek": this.currentDayinWeek,
        "phaseMode": this.phaseMode,
        "alarms": this.alarms,
        "dateTriggers": this.dateTriggers,
        "monthlyTriggers": this.monthlyTriggers,
        "yearlyTrigger": this.yearlyTrigger,
        "tickTimer": this.tickTimer,
        "tickCounter": this.tickCounter,
        "currentTick": this.currentTick,
        "currentPhase": this.currentPhase,
        "currentSeason": this.currentSeason,
        "currentWeek": this.currentWeek,
      };
    }

    LoadFromJson(o) {
      this.enabled = o["enabled"];
      this.tickRate = o["tickRate"];
      this.tickDurationType = o["tickDurationType"];
      this.ticksPer = o["ticksPer"];
      this.currentMinute = o["currentMinute"];
      this.currentHour = o["currentHour"];
      this.currentDay = o["currentDay"];
      this.currentMonth = o["currentMonth"];
      this.currentYear = o["currentYear"];
      this.currentDayinWeek = o["currentDayinWeek"];
      this.phaseMode = o["phaseMode"];
      this.alarms = o["alarms"];
      this.dateTriggers = o["dateTriggers"];
      this.monthlyTriggers = o["monthlyTriggers"];
      this.yearlyTrigger = o["yearlyTrigger"];
      this.tickTimer = o["tickTimer"];
      this.tickCounter = o["tickCounter"];
      this.currentTick = o["currentTick"];
      this.currentPhase = o["currentPhase"];
      this.currentSeason = o["currentSeason"];
      this.currentWeek = o["currentWeek"];
    }

    Trigger(method) {
      super.Trigger(method);
      const addonTrigger = addonTriggers.find((x) => x.method === method);
      if (addonTrigger) {
        this.GetScriptInterface().dispatchEvent(new C3.Event(addonTrigger.id));
      }
    }

    GetDebuggerProperties() { 
      return [
        {
          title: "TimeSystem",
          properties: [
            {
              name: "$Enabled",
              value: this.enabled
            },
            {
              name: "$Tick Rate",
              value: this.tickRate
            },
            {
              name: "$Current Tick",
              value: this.currentTick
            },
            {
              name: "$Current Minute",
              value: this.currentMinute
            },
            {
              name: "$Current Hour",
              value: this.currentHour
            },
            {
              name: "$Current Day",
              value: this.currentDay
            },
            {
              name: "$Current Month",
              value: this.currentMonth
            },
            {
              name: "$Current Year",
              value: this.currentYear
            },
            {
              name: "$Current Day in Week",
              value: DAYS[this.currentDayinWeek]
            },
            {
              name: "$Current Phase",
              value: this.currentPhase
            },
            {
              name: "$Current Season",
              value: this.currentSeason
            },
            {
              name: "$Current Week",
              value: this.currentWeek
            },
          ]
        }
      ];
    }

    GetScriptInterfaceClass() {
      return scriptInterface;
    }
  };
}
