process.chdir(__dirname)

const pug = require("pug")
const sass = require("sass")
const fs = require("fs").promises
const crypto = require("crypto")
const pj = require("path").join

const buildDir = "../build"

function hash(buffer) {
	return crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 10)
}

const static = new Map()
const pugLocals = {static}

async function addFile(sourcePath, targetPath) {
	const contents = await fs.readFile(pj(".", sourcePath), {encoding: null})
	static.set(sourcePath, `${targetPath}?static=${hash(contents)}`)
	fs.writeFile(pj(buildDir, targetPath), contents)
}

async function addSass(sourcePath, targetPath) {
	const renderedCSS = sass.renderSync({
		file: pj(".", sourcePath),
		outputStyle: "compressed",
		functions: {
			"static($name)": function(name) {
				if (!(name instanceof sass.types.String)) {
					throw "$name: expected a string"
				}
				return new sass.types.String(static.get(name.getValue()))
			}
		}
	}).css
	static.set(sourcePath, `${targetPath}?static=${hash(renderedCSS)}`)
	await fs.writeFile(pj(buildDir, targetPath), renderedCSS)
}

async function addPug(sourcePath, targetPath) {
	const renderedHTML = pug.compileFile(pj(".", sourcePath))(pugLocals)
	await fs.writeFile(pj(buildDir, targetPath), renderedHTML)
}

;(async () => {
	await Promise.all([
		addFile("/assets/img/invidious-logo-dark.svg", "/static/img/invidious-logo-dark.svg"),
		addFile("/assets/img/invidious-logo-light.svg", "/static/img/invidious-logo-light.svg"),
		addFile("/main.js", "/static/js/main.js")
	])

	addSass("/main.sass", "/static/css/main.css")

	addPug("/index.pug", "/index.html")

	console.log("Build complete.")
})()
