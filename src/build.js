process.chdir(__dirname)

const pug = require("pug")
const sass = require("sass")
const fs = require("fs").promises
const crypto = require("crypto")
const pj = require("path").join
const babel = require("@babel/core")

const buildDir = "../build"

const static = new Map()
const links = new Map()
const scripts = []
const pugLocals = {static, scripts, links, instancesJson: []}

const spec = [
	{
		type: "file",
		source: "/assets/img/invidious-logo-dark.svg",
		target: "/static/img/invidious-logo-dark.svg"
	},{
		type: "file",
		source: "/assets/img/invidious-logo-light.svg",
		target: "/static/img/invidious-logo-light.svg"
	},{
		type: "sass",
		source: "/main.sass",
		target: "/static/css/main.css"
	},{
		type: "babel",
		source: "/main.js",
		target: "/static/js/main.js"
	},{
		type: "pug",
		source: "/index.pug",
		target: "/index.html"
	},{
		type: "pug",
		source: "/js-licenses.pug",
		target: "/js-licenses.html"
	}
]

function hash(buffer) {
	return crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 10)
}

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

async function addBabel(sourcePath, targetPath) {
	const originalCode = await fs.readFile(pj(".", sourcePath), "utf8")

	const compiled = babel.transformSync(originalCode, {
		sourceMaps: true,
		sourceType: "script",
		presets: [
			[
				"@babel/env", {
					targets: {
						"ie": 11
					}
				}
			]
		],
		generatorOpts: {
			comments: false,
			minified: true,
			sourceMaps: true,
		}
	})

	const minFilename = targetPath.replace(/\.js$/, ".min.js")
	const minFilenameWithQuery = `${minFilename}?static=${hash(compiled.code)}`
	const mapFilename = `${minFilename}.map`

	compiled.code += `\n//# sourceMappingURL=${mapFilename}`

	static.set(sourcePath, minFilenameWithQuery)
	scripts.push({
		original: targetPath,
		minified: minFilename,
		license: "GNU-AGPL-3.0-or-later",
		licenseHref: "http://www.gnu.org/licenses/agpl-3.0.html"
	})

	await Promise.all([
		fs.writeFile(pj(buildDir, targetPath), originalCode),
		fs.writeFile(pj(buildDir, minFilename), compiled.code),
		fs.writeFile(pj(buildDir, mapFilename), JSON.stringify(compiled.map))
	])
}

;(async () => {
	// Stage 1: Register
	pugLocals.instancesJson = JSON.parse(await fs.readFile('../instances.json', 'utf8'))

	for (const item of spec) {
		if (item.type === "pug") {
			links.set(item.source, item.target)
		}
	}

	// Stage 2: Build
	for (const item of spec) {
		if (item.type === "file") {
			await addFile(item.source, item.target)
		} else if (item.type === "sass") {
			await addSass(item.source, item.target)
		} else if (item.type === "babel") {
			await addBabel(item.source, item.target)
		} else if (item.type === "pug") {
			await addPug(item.source, item.target)
		} else {
			throw new Error("Unknown item type: "+item.type)
		}
	}

	console.log("Build complete.")
})()
