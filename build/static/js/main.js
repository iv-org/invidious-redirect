"use strict";

;(() => {
	const q = s => document.querySelector(s)
	const qa = s => document.querySelectorAll(s)

	function createElement(tag, properties = {}, children = []) {
		const e = document.createElement(tag)
		for (const key of Object.keys(properties)) {
			e[key] = properties[key]
		}
		for (const child of children) {
			e.appendChild(child)
		}
		return e
	}

	function shuffle(array) {
		for (let i = 0; i < array.length; i++) {
			let j = Math.floor(Math.random() * (array.length-i)) + i
			;[array[i], array[j]] = [array[j], array[i]]
		}
		return array
	}

	const destinationPath = window.location.href.slice(window.location.origin.length)

	q("#watch-on-youtube").href = "https://www.youtube.com" + destinationPath

	fetch("https://instances.invidio.us/instances.json?sort_by=type,health").then(res => res.json()).then(
	/** @param {[string, {monitor: any, flag: string, region: string, stats: any, type: string, uri: string}][]} root */ root => {
		shuffle(root)
		root.map(entry => {
			const healthKnown = !!entry[1].monitor
			return {
				name: entry[0],
				details: entry[1],
				health: +(healthKnown ? entry[1].monitor.dailyRatios[0].ratio : 99),
				healthKnown
			}
		}).filter(entry => {
			return entry.details.type === "https" && entry.health > 0
		}).sort((a, b) => {
			return b.health - a.health
		}).forEach(entry => {
			let target = entry.details.uri.replace(/\/*$/, "") + destinationPath
			const healthUnknown = entry.healthKnown ? "" : "health-unknown "
			const health = entry.healthKnown ? entry.health.toFixed(0) : "(unknown)"
			q("#instances-tbody").appendChild(
				createElement("tr", {}, [
					createElement("td", {textContent: entry.name}),
					createElement("td", {className: "column-center "+healthUnknown, textContent: health}),
					createElement("td", {className: "column-center"}, [
						createElement("a", {href: target, textContent: "Go →"})
					])
				])
			)
		})
		qa(".loading").forEach(e => e.remove())
	})
})()
