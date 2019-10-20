class Time{
	static getTime(){
		let d = new Date();
		let t = d.getTime();
		t -= (7 * 60 * 60 * 1000);
		let uy = Math.floor(t / (365 * 24 * 60 * 60 * 1000));
		let years = Math.floor(uy) + 1970;
		let days = t - (uy * (365 * 24 * 60 * 60 * 1000));
		days = Math.floor(days / (24 * 60 * 60 * 1000));
		let hours = t - ((days + (uy * 365)) * 24 * 60 * 60 * 1000);
		hours = Math.floor(hours / (60 * 60 * 1000));
		let minutes = t - ((hours + (days * 24) + (uy * 365 * 24)) * 60 * 60 * 1000);
		minutes = Math.floor(minutes / (60 * 1000));
		let seconds = t - ((minutes + ((hours + ((days + (uy * 365)) * 24)) * 60)) * 60 * 1000);
		seconds = Math.floor(seconds / 1000);
		return {
			seconds: seconds,
			minutes: minutes,
			hours: hours,
			days: days,
			years: years
		};
	}
	static getFormattedTime(){
		let t = Time.getTime();
		let ex = "AM"
		if(t.hours > 12){
			ex = "PM";
		}
		return t.hours + ":" + t.minutes + ":" + t.seconds + " " + ex;
	}
}