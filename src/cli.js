import process from "process"
import { promises as fs } from "fs"
import path from "path"

import { parse } from "./lcov"
import { diff } from "./comment"

async function main() {
	const file = process.argv[2]
	const beforeFile = process.argv[3]
	const prefix = path.dirname(path.dirname(path.resolve(file))) + "/"

	const content = await fs.readFile(file, "utf-8")
	const lcov = await parse(content)

	let before
	if (beforeFile) {
		const content = await fs.readFile(beforeFile, "utf-8")
		before = await parse(content)
		// console.log(before);
	}

	const options = {
		repository: "example/foo",
		commit: "f9d42291812ed03bb197e48050ac38ac6befe4e5",
		prefix,
		head: "feat/test",
		base: "master",
		fractions: false,
	}
	const result = diff(lcov, before, options);
	// console.log(result)
	console.log(result.length, 65536);

	fs.writeFile("result.html", result);
}

main().catch(function(err) {
	console.log(err)
	process.exit(1)
})
