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

	const destinationPath = window.location.href.slice(window.location.origin.length)

	q("#watch-on-youtube").href = "https://www.youtube.com" + destinationPath

	fetch("https://instances.invidio.us/instances.json?pretty=1&sort_by=type,health").then(res => res.json()).then(
	/** @param {[string, {monitor: any, flag: string, region: string, stats: any, type: string, uri: string}][]} root */ root => {
		console.log(root)
		root.filter(entry => entry[1].type === "https").forEach(entry => {
			let healthUnknown = "health-unknown "
			let health = "(unknown)"
			if (entry[1].monitor && entry[1].monitor.dailyRatios && entry[1].monitor.dailyRatios[0]) {
				health = entry[1].monitor.dailyRatios[0].ratio
				healthUnknown = ""
			}
			let target = entry[1].uri.replace(/\/*$/, "") + destinationPath
			q("#instances-tbody").appendChild(
				createElement("tr", {}, [
					createElement("td", {textContent: entry[0]}),
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
