const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'Decemeber'];
const PHASES = ['Dawn', 'Morning', 'Afternoon', 'Day', 'Dusk', 'Night', 'LateNight'];
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const SOLAR_TERMS = [
  {'longitude':315,   'minutes':42467,    'term':'BeginningOfSpring',  index:0},
  {'longitude':330,   'minutes':63836,    'term':'RainWater',          index:1},
  {'longitude':345,   'minutes':85337,    'term':'AwakeningOfInsects', index:2},
  {'longitude':0,     'minutes':107014,   'term':'SpringEquinox',      index:3},
  {'longitude':15,    'minutes':128867,   'term':'PureBrightness',     index:4},
  {'longitude':30,    'minutes':150921,   'term':'GrainRain',          index:5},
  {'longitude':45,    'minutes':173149,   'term':'BeginningOfSummer',  index:6},
  {'longitude':60,    'minutes':195551,   'term':'GrainBuds',          index:7},
  {'longitude':75,    'minutes':218072,   'term':'GrainInEar',         index:8},
  {'longitude':90,    'minutes':240693,   'term':'SummerSolstice',     index:9},
  {'longitude':105,   'minutes':263343,   'term':'MinorHeat',          index:10},
  {'longitude':120,   'minutes':285989,   'term':'Majorheat',          index:11},
  {'longitude':135,   'minutes':308563,   'term':'BeginningOfAutumn',  index:12},
  {'longitude':150,   'minutes':331033,   'term':'EndOfHeat',          index:13},
  {'longitude':165,   'minutes':353350,   'term':'WhiteDew',           index:14},
  {'longitude':180,   'minutes':375494,   'term':'AutumnEquinox',      index:15},
  {'longitude':195,   'minutes':397447,   'term':'ColdDew',            index:16},
  {'longitude':210,   'minutes':419210,   'term':'FrostsDescent',      index:17},
  {'longitude':225,   'minutes':440795,   'term':'BeginningOfWinter',  index:18},
  {'longitude':240,   'minutes':462224,   'term':'MinorSnow',          index:19},
  {'longitude':255,   'minutes':483532,   'term':'MajorSnow',          index:20},
  {'longitude':270,   'minutes':504758,   'term':'WinterSolstice',     index:21},
  {'longitude':285,   'minutes':0,        'term':'MinorCold',          index:22},
  {'longitude':300,   'minutes':21208,    'term':'MajorCold',          index:23},
];

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
      this.currentDayInYear = 1;
      this.currentDayinWeek = 1;
      this.autoDetermineDay = false;
      this.currentMonth = 1;
      this.currentYear = 0;
      this.phaseMode = 0;
      this.currentPhase = PHASES[4];
      this.currentSeason = SEASONS[0];
      this.currentSolarTerm = SOLAR_TERMS[0];
      this.solarTermDates = null;

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
        this.autoDetermineDay = properties[9];
        this.currentDayinWeek = properties[10];
        this.phaseMode = properties[11];
      }

      this.Init();

      if(this.enabled){
        this.StartTickSystem();
      }
    }

    Init() {
      if(this.autoDetermineDay){
        this.currentDayinWeek = this.GetCurrentDayOfTheWeek();
      }

      this.solarTermDates = this.CalculateSolarTermDates(this.currentYear);
      this.currentWeek = this.CalculateCurrentWeek();
      this.currentDayInYear = this.CalculateCurrentDayOfYear();
      this.CheckSeasonChange();
      this.CheckPhaseChange();
      this.CheckSolarTermChange();
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

      this.currentDay = day;
      this.currentMonth = month;
      this.currentYear = year;
      this.currentDayinWeek = this.autoDetermineDay ? this.GetCurrentDayOfTheWeek() : (this.currentDayinWeek + diffDays) % 7;
      this.currentWeek = this.CalculateCurrentWeek();
      this.currentDayInYear = this.CalculateCurrentDayOfYear();
      
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
      this.CheckSeasonChange();
      this.CheckSolarTermChange();
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

      this.currentDay = day;
      this.currentMonth = month;
      this.currentYear = year;
      this.currentDayinWeek = this.autoDetermineDay ? this.GetCurrentDayOfTheWeek() : (this.currentDayinWeek + diffDays) % 7;
      this.solarTermDates = this.CalculateSolarTermDates(this.currentYear);
      this.currentWeek = this.CalculateCurrentWeek();
      this.currentDayInYear = this.CalculateCurrentDayOfYear();

      if(ampm === 1){
        hour += 12;
      }
      this.currentHour = hour;
      this.currentMinute = minute;

      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
      this.CheckSeasonChange();
      this.CheckSolarTermChange();
    }

    SetAutoDetermineDay(auto) {
      this.autoDetermineDay = auto;
      this.currentDayinWeek = this.autoDetermineDay ? this.GetCurrentDayOfTheWeek() : this.currentDayinWeek;
    }

    GetDaysFromMiliseconds(milliseconds) {
      return Math.floor(milliseconds / (1000 * 60 * 60 * 24));
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

      // get day difference
      const curTime =  this.GetDaysFromMiliseconds(current.getTime());
      const newTime = this.GetDaysFromMiliseconds(newDate.getTime());
      const diffDays = Math.abs(curTime - newTime);
      
      this.currentDay = newDate.getDate();
      this.currentMonth = newDate.getMonth()+1;
      this.currentYear = newDate.getFullYear();
      this.currentHour = newDate.getHours();
      this.currentMinute = newDate.getMinutes();
      this.currentDayinWeek = this.autoDetermineDay ? this.GetCurrentDayOfTheWeek() : (this.currentDayinWeek + diffDays) % 7;
      this.currentWeek = this.CalculateCurrentWeek();
      this.currentDayInYear = this.CalculateCurrentDayOfYear();
      this.solarTermDates = this.CalculateSolarTermDates(this.currentYear);

      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnAnyDateTimeChanged);
      this.CheckPhaseChange();
      this.CheckSeasonChange();
      this.CheckSolarTermChange();
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
      this.currentDayInYear++;
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

    IsSolarTerm(solarTerm) {
      return this.currentSolarTerm.term == SOLAR_TERMS[solarTerm].term;
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

    IsDayTime() {
      return this.currentHour >= 6 && this.currentHour < 18;
    }

    IsNightTime() {
      return this.currentHour >= 18 && this.currentHour < 6;
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

    CurrentDayInYear() {
      return this.currentDayInYear;
    }

    CurrentSolarTerm() {
      return this.currentSolarTerm.index;
    }

    CurrentSolarTermName() {
      return this.currentSolarTerm.term;
    }

    CurrentSolarTermLongitude() {
      return this.currentSolarTerm.longitude;
    }

    CurrentSeasonIndex() {
      return SEASONS.indexOf(this.currentSeason);
    }

    CurrentPhaseOfDayIndex() {
      return PHASES.indexOf(this.currentPhase);
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

    CalculateCurrentDayOfYear() {
      let daysSinceFirstDay = this.currentDay;
      for (let i = 1; i < this.currentMonth; i++) {
        daysSinceFirstDay += this.GetMaxDaysMonth(i);
      }
      return daysSinceFirstDay;
    }

    CalculateSolarTermDates(year) {
      const baseTimeForYear = 31556925974.7 * (year - 1900) + Date.UTC(1900,0,6,2,5);
      let solarTermsDates = [];
      for(let n = 0; n < 24; n++) {
          let termDate = new Date(baseTimeForYear + SOLAR_TERMS[n].minutes * 60000);
          solarTermsDates.push({ longitude: SOLAR_TERMS[n].longitude, term: SOLAR_TERMS[n].term, days: this.GetDayOfYear(termDate), index: SOLAR_TERMS[n].index }); 
      }
      return solarTermsDates;
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
            this.currentDayInYear++;
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
      }
    }

    ProcessHour() {
      this.CheckPhaseChange();

      //check for noon
      if(this.currentHour === 12){
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnNoon);
      }

      //check for midnight
      if(this.currentHour === 24){
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnMidnight);
      }

      if(this.currentHour >= 24){
        this.currentHour = 0;
        this.currentDay++;
        this.currentDayinWeek++;
        this.currentDayInYear++;
        this.ProcessDay();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDay);
      }
    }

    ProcessDay() {
      this.CheckSolarTermChange();

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
      }
    }

    ProcessMonth() {
      this.CheckSeasonChange();

      if(this.currentMonth > 12){
        this.currentMonth = 1;
        this.currentWeek = 1
        this.currentYear++;
        this.ProcessYear();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnYear);
      }
    }

    ProcessYear() {
      this.solarTermDates = this.CalculateSolarTermDates(this.currentYear);
      this.currentDayInYear = 1;
      this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnNewYear);
    }

    CheckSolarTermChange() {
      const previousSolarTerm = this.currentSolarTerm.term;
      this.currentSolarTerm = this.GetSolarTerm(this.currentDayInYear);

      if(previousSolarTerm !== this.currentSolarTerm.term){
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnSolarTermChanged);
      }
    }

    GetSolarTerm(day) {
      let solarTerm = this.solarTermDates[21]; //get last solar term in year

      const solarTerms = this.solarTermDates.slice().sort((a, b) => (a.days > b.days) ? 1 : -1);
      for (let i = 0; i < solarTerms.length; i++) {
        if (day >= solarTerms[i].days) {
          solarTerm = solarTerms[i];
        }
      }
      return  solarTerm;
    }

    GetCurrentDayOfTheWeek() {
      const date = new Date(this.currentYear, this.currentMonth-1, this.currentDay);
      return date.getDay();
    }

    GetDayOfYear(date) {
      const start = new Date(date.getFullYear(), 0, 0);
      const diff = (date - start);;
      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor(diff / oneDay);
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
      }
    }

    GetDayPhaseTwo(modifier = 0) {
      const hour = this.currentHour + modifier;
      if(hour >= 6 && hour < 18){
        return PHASES[3]; // Day
      }else{
        return PHASES[5]; // Night
      }
    }

    GetDayPhaseFour(modifier = 0) {
      const hour = this.currentHour + modifier;
      if(hour >= 6 && hour < 12){
        return PHASES[1]; // Morning
      }else if(hour >= 12 && hour < 18){
        return PHASES[2]; // Afternoon
      }else if(hour >= 18 && hour < 24){
        return PHASES[5]; // Night
      }else{
        return PHASES[6]; // Late Night
      }
    }

    GetDayPhaseSix(modifier = 0) {
      const hour = this.currentHour + modifier;
      if(hour >= 5 && hour < 8){
        return PHASES[0]; // Dawn
      }else if(hour >= 8 && hour < 12){
        return PHASES[1]; // Morning
      }else if(hour >= 12 && hour < 17){
        return PHASES[2]; // Afternoon
      }else if(hour >= 17 && hour < 20){
        return PHASES[4]; // Dusk
      }else if(hour >= 20 && hour < 24){
        return PHASES[5]; // Night
      }else{
        return PHASES[6]; // Late Night
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
        "currentDayInYear": this.currentDayInYear,
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
      this.currentDayInYear = o["currentDayInYear"];
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
              name: "$Current Day in Year",
              value: this.currentDayInYear
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
              name: "$Current Solar Term",
              value: this.currentSolarTerm.term
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
