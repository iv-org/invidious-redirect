const fs = require("fs")

fetch("https://api.invidious.io/instances.json?pretty=1&sort_by=type,users").then(function (data) {
    return data.json()
}).then(function (data) {
    const instances = data.filter(instance => {
        return instance[1].type === 'https'
    }).map((instance) => {
        return { flag: instance[1].flag, url: instance[0] }
    })
    
    if (instances.length === 0) {
        throw new Error("No instances found. Likely an issue with the instance list.")
    }

    fs.writeFile("./instances.json", JSON.stringify(instances, null, 2), (err) => {

    })
})
