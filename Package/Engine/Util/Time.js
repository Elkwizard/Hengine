class Time {
	static get currentTime() {
		return performance.now();
	}
	static getTime() {
		let d = new Date();
		return {
			seconds: d.getSeconds(),
			minutes: d.getMinutes(),
			hours: d.getHours(),
			days: d.getDay(),
			years: d.getYear() + 1900
		};
	}
	static sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	static millisecondsToStandard(t, yearsSinceCounterStarted = 0) {
		let uy = Math.floor(t / (365 * 24 * 60 * 60 * 1000));
		let years = uy + yearsSinceCounterStarted;
		let days = t - (uy * (365 * 24 * 60 * 60 * 1000));
		days = Math.floor(days / (24 * 60 * 60 * 1000));
		let hours = t - ((days + (uy * 365)) * 24 * 60 * 60 * 1000);
		hours = Math.floor(hours / (60 * 60 * 1000));
		let minutes = t - ((hours + (days * 24) + (uy * 365 * 24)) * 60 * 60 * 1000);
		minutes = Math.floor(minutes / (60 * 1000));
		let seconds = t - ((minutes + ((hours + ((days + (uy * 365)) * 24)) * 60)) * 60 * 1000);
		seconds = Math.floor(seconds / 1000 * 1000) / 1000;
		return {
			seconds: seconds,
			minutes: minutes,
			hours: hours,
			days: days,
			years: years
		};
	}
	static formatTime(t) {
		let ary = [];
		let shorthand = {
			"years": "y",
			"days": "d",
			"hours": "h",
			"minutes": "m",
			"seconds": "s"
		}
		for (let key of ["years", "days", "hours", "minutes", "seconds"]) {
			let start = t[key];
			if (start % 1) start = t[key].toFixed(2); 
			if (t[key] || key == "seconds") ary.push(start + shorthand[key]);
		}
		return ary.join(" ");
	}
	static formatMS(ms) {
		return Time.formatTime(Time.millisecondsToStandard(ms, 0));
	}
	static getFormattedTime() {
		let t = Time.getTime();
		let ex = "AM";
		if (t.days > 30 && t.days < 330) t.hours--;
		if (t.hours > 12) {
			t.hours -= 12;
			ex = "PM";
		}
		if (t.minutes.toString().length < 2) t.minutes = "0" + t.minutes.toString();
		if (t.seconds.toString().length < 2) t.seconds = "0" + t.seconds.toString();
		return t.hours + ":" + t.minutes + ":" + t.seconds + " " + ex;
	}
}