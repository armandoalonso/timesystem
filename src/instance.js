const e = require("cors");

function getInstanceJs(parentClass, scriptInterface, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);

      this.enabled = false;
      this.tickTimer = 0;
      this.tickRate = 1000;       // how many milliseconds between each tick
      this.ticksPerMintue = 5;
      this.timer = null;

      this.currentTick = 0;
      this.currentMinute = 0;
      this.currentHour = 0;
      this.currentDay = 1;
      this.currentWeek = 1;
      this.currentDayinWeek = 1;
      this.currentMonth = 1;
      this.currentYear = 0;

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
        this.currenTick++;
        this.tickTimer = 0;

        this.Trigger(C3.Behaviors.piranha305_timesystem.Cnds.OnTick);
        this.ProcessTick();
      }
    }

    ProcessTick() {
      if(this.currentTick > this.ticksPerMintue){
        this.currentTick = 0;
        this.currentMinute++;
        this.Trigger(C3.Behaviors.piranha305_timesystem.Cnds.OnMinute);
        this.ProcessMinute();
      }
    }

    ProcessMinute() {
      if(this.currentMinute > 60){
        this.currentMinute = 0;
        this.currentHour++;
        this.Trigger(C3.Behaviors.piranha305_timesystem.Cnds.OnHour);
        this.ProcessHour();
      }
    }

    ProcessHour() {
      if(this.currentHour > 24){
        this.currentHour = 0;
        this.currentDay++;
        this.currentDayinWeek++;
        this.Trigger(C3.Behaviors.piranha305_timesystem.Cnds.OnDay);
        this.ProcessDay();
      }
    }

    ProcessDay() {
      if(this.currentDayinWeek > 7){
        this.currentDayinWeek = 0;
        this.currentWeek++;
        this.Trigger(C3.Behaviors.piranha305_timesystem.Cnds.OnWeek);
        this.ProcessWeek();
      }

      if(this.currentDay > this.GetMaxDaysMonth(this.currentMonth)){
        this.currentDay = 0;
        this.currentMonth++;
        this.Trigger(C3.Behaviors.piranha305_timesystem.Cnds.OnMonth);
        this.ProcessMonth();
      }
    }

    ProcessMonth() {
      if(this.currentMonth > 12){
        this.currentMonth = 1;
        this.currentWeek = 1
        this.currentYear++;
        this.Trigger(C3.Behaviors.piranha305_timesystem.Cnds.OnYear);
        this.ProcessYear();
      }
    }

    ProcessYear() {
      this.Trigger(C3.Behaviors.piranha305_timesystem.Cnds.OnNewYear);
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
