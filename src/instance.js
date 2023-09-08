const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'Decemeber'];
const PHASES = ['Dawn', 'Morning', 'Noon', 'Afternoon', 'Day', 'Dusk', 'Night', 'Midnight', 'Late Night'];

function getInstanceJs(parentClass, scriptInterface, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);

      this.enabled = false;
      this.tickTimer = 0;
      this.tickRate = 1;       // how many seconds between each tick
      this.ticksPerMintue = 5;
      this.timer = null;

      this.currentTick = 0;
      this.tickMintueCounter = 0;
      this.currentMinute = 0;
      this.currentHour = 0;
      this.currentDay = 1;
      this.currentWeek = 1;
      this.currentDayinWeek = 1;
      this.currentMonth = 1;
      this.currentYear = 0;
      this.phaseMode = 0;
      this.currentPhase = PHASES[4];

      if (properties) {
        this.enabled = properties[0];
        this.tickRate = properties[1];
        this.ticksPerMintue = properties[2];

        this.currentMinute = properties[3];
        this.currentHour = properties[4];
        this.currentDay = properties[5];
        this.currentMonth = properties[6];
        this.currentYear = properties[7];
        this.currentDayinWeek = properties[8];
        this.phaseMode = properties[9];
      }

      this.Init();

      if(this.enabled){
        this.StartTickSystem();
      }
    }

    Init() {
      this.currentWeek = this.CalculateCurrentWeek();
    }

    CalculateCurrentWeek() {
      const daysSinceFirstDay = this.currentDay;
      for (let i = 1; i < this.currentMonth; i++) {
        daysSinceFirstDay += this.GetMaxDaysMonth(i);
      }
      const daysUntilFirstWeek = 7 - ((this.currentDayinWeek + daysSinceFirstDay - 1) % 7);
      const currentWeek = Math.ceil((daysSinceFirstDay - daysUntilFirstWeek) / 7) + 1;
      return currentWeek;
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

    StartTickSystem() {
      this._StartTicking();
    }

    StopTickSystem() {
      this._StopTicking();
    }

    Tick() {
      this.tickTimer += this._runtime.GetDt();
      if(this.tickTimer > this.tickRate){
        this.currentTick++;
        this.tickMintueCounter++;
        this.tickTimer = 0;
        this.ProcessTick();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnTick);
      }
    }

    ProcessTick() {
      if(this.tickMintueCounter >= this.ticksPerMintue){
        this.tickMintueCounter = 0;
        this.currentMinute++;
        this.ProcessMinute();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnMinute);
      }
    }

    ProcessMinute() {
      console.log(this.currentMinute);
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
        this.ProcessWeek();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnWeek);
      }

      if(this.currentDay > this.GetMaxDaysMonth(this.currentMonth)){
        this.currentDay = 0;
        this.currentMonth++;
        this.ProcessMonth();
        this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnMonth);
      }
    }

    CheckPhaseChange() {
      // at this point current hour has increased by 1
      // check if phase has changed by comapring current hour to previous hour
      let previousPhase = "";
      let currentPhase = ""
      switch (this.phaseMode) {
        case 0: // 2 phases
          previousPhase = this.GetDayPhaseTwo(-1);
          currentPhase = this.GetDayPhaseTwo();
          if(previousPhase !== currentPhase){
            this.currentPhase = currentPhase;
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDayPhaseChange);
          }
          break;
        case 1: // 4 phases
          previousPhase = this.GetDayPhaseFour(-1);
          currentPhase = this.GetDayPhaseFour();
          if(previousPhase !== currentPhase){
            this.currentPhase = currentPhase;
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDayPhaseChange);
          }
          break;
        case 2: // 6 phases
          previousPhase = this.GetDayPhaseSix(-1);
          currentPhase = this.GetDayPhaseSix();
          if(previousPhase !== currentPhase){
            this.currentPhase = currentPhase;
            this.Trigger(C3.Plugins.piranha305_timesystem.Cnds.OnDayPhaseChange);
          }
          break;
        case 3: // 8 phases
          previousPhase = this.GetDayPhaseEight(-1);
          currentPhase = this.GetDayPhaseEight();
          if(previousPhase !== currentPhase){
            this.currentPhase = currentPhase;
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

    GetDayPhaseEight(modifier = 0) {
      const hour = this.currentHour + modifier;
      if(hour >= 5 && hour < 8){
        return PHASES[0]; // Dawn
      }else if(hour >= 8 && hour < 11){
        return PHASES[1]; // Morning
      }else if(hour >= 11 && hour < 14){
        return PHASES[2]; // Noon
      }else if(hour >= 14 && hour < 17){
        return PHASES[3]; // Afternoon
      }else if(hour >= 17 && hour < 20){
        return PHASES[5]; // Dusk
      }else if(hour >= 20 && hour < 23){
        return PHASES[6]; // Night
      }else if(hour >= 23 && hour < 2){
        return PHASES[7]; // Midnight
      }else{
        return PHASES[8]; // Late Night
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

    DayFullName() {
      return DAYS[this.currentDayinWeek];
    }

    DayShortName() {
      return DAYS[this.currentDayinWeek].substring(0, 3);
    }

    MonthFullName() {
      return MONTHS[this.currentMonth];
    }

    MonthShortName() {
      return MONTHS[this.currentMonth].substring(0, 3);
    }

    Time24() {
      return this.currentHour.toString().padStart(2, '0') + ':' + this.currentMinute.toString().padStart(2, '0');
    }

    Time12() {
      let hour = this.currentHour % 12;
      if (hour === 0) {
        hour = 12;
      }
      const ampm = this.currentHour < 12 ? 'am' : 'pm';
      return hour.toString().padStart(2, '0') + ':' + this.currentMinute.toString().padStart(2, '0') + ampm;
    }

    Release() {
      super.Release();
    }

    SaveToJson() {
      return {
        // data to be saved for savegames
      };
    }

    LoadFromJson(o) {
      // load state for savegames
    }

    Trigger(method) {
      super.Trigger(method);
      const addonTrigger = addonTriggers.find((x) => x.method === method);
      if (addonTrigger) {
        this.GetScriptInterface().dispatchEvent(new C3.Event(addonTrigger.id));
      }
    }

    GetScriptInterfaceClass() {
      return scriptInterface;
    }
  };
}
