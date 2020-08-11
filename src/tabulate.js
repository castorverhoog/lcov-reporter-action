import { th, tr, td, table, tbody, a, b, span, fragment } from "./html"

// Tabulate the lcov data in a HTML table.
export function tabulate(lcov, options) {
	const head = tr(
		th("File"),
		th({colspan: options.fractions ? 2 : 1}, "Branches"),
		th({colspan: options.fractions ? 2 : 1}, "Funcs"),
		th({colspan: options.fractions ? 2 : 1}, "Lines"),
		th("Uncovered Lines"),
	)

	const folders = {}
	for (const file of lcov) {
		const parts = file.file.replace(options.prefix, "").split("/")
		const folder = parts.slice(0, -1).join("/")
		folders[folder] = folders[folder] || []
		folders[folder].push(file)
	}

	const rows = Object.keys(folders)
		.sort()
		.reduce(
			(acc, key) => [
				...acc,
				toFolder(key, options),
				...folders[key].map(file => toRow(file, key !== "", options)),
			],
			[],
		)

	return table(tbody(head, ...rows))
}

function toFolder(path) {
	if (path === "") {
		return ""
	}

	return tr(td({ colspan: options.fractions ? 8 : 5 }, b(path)))
}

function toRow(file, indent, options) {
	if(options.fractions)
	return tr(
    td(filename(file, indent, options)),
    td(fraction(file.branches, options)),
		td(percentage(file.branches, options)),
		td(fraction(file.functions, options)),
		td(percentage(file.functions, options)),
		td(fraction(file.lines, options)),
		td(percentage(file.lines, options))
  );
  else return tr(
		td(filename(file, indent, options)),
		td(percentage(file.branches, options)),
		td(percentage(file.functions, options)),
		td(percentage(file.lines, options)),
		td(uncovered(file, options)),
	)
}

function filename(file, indent, options) {
	const relative = file.file.replace(options.prefix, "")
	const href = `https://github.com/${options.repository}/blob/${options.commit}/${relative}`
	const parts = relative.split("/")
	const last = parts[parts.length - 1]
	const space = indent ? "&nbsp; &nbsp;" : ""
	return fragment(space, last)//a({ href }, last))
}

function fraction(item) {
  const value = `${item.hit}/${item.found}`

	const tag = item.hit === item.found ? fragment : b

  return tag(value);
}

function percentage(item) {
	if (!item) {
		return "N/A"
	}

	const value = item.found === 0 ? 100 : (item.hit / item.found) * 100
	const rounded = value.toFixed(2).replace(/\.0*$/, "")

	const tag = value === 100 ? fragment : b

	return tag(`${rounded}%`)
}

function uncovered(file, options) {
	const branches = (file.branches ? file.branches.details : [])
		.filter(branch => branch.taken === 0)
		.map(branch => branch.line)

	const lines = (file.lines ? file.lines.details : [])
		.filter(line => line.hit === 0)
		.map(line => line.line)

	const all = [...branches, ...lines].sort()

	return all
		.map(function(line) {
			return line;
			const relative = file.file.replace(options.prefix, "")
			const href = `https://github.com/${options.repository}/blob/${options.commit}/${relative}#L${line}`
			return a({ href }, line)
		})
		.join(", ")
}
