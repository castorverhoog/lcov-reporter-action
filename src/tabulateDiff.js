import { th, tr, td, table, tbody, a, b, del, span, fragment } from "./html"
import { isEqual, differenceWith } from "lodash";

// Tabulate the lcov data in a HTML table.
export function tabulateDiff(lcov, before, options) {
	const head = tr(
		th("File"),
		th({colspan: options.fractions ? 2 : 1}, "Branches"),
		th({colspan: options.fractions ? 2 : 1}, "Funcs"),
		th({colspan: options.fractions ? 2 : 1}, "Lines")
  )
  const removeDetails = report =>
    report.map(file => ({
      ...file,
      lines: {
        ...file.lines,
        details: undefined
      },
      functions: {
        ...file.functions,
        details: undefined
      },
      branches: {
        ...file.branches,
        details: undefined
      }
    }));
  lcov = removeDetails(lcov);
  before = removeDetails(before);
  const toObject = (report) =>
    report.reduce((acc, key) => ({
      ...acc,
      [key.file]: {
        ...key
      }
    }), {})
  const base = toObject(before)

  const combined = differenceWith(lcov, before, isEqual).map(file => ({
      file: file.file,
      before: {
        ...base[file.file]
      },
      after: {
        ...file
      }
    })
  )

  if(combined.length === 0) return ``;

	const folders = {}
	for (const file of combined) {
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


function toFolder(path, options) {
	if (path === "") {
		return ""
	}

	return tr(td({ colspan: options.fractions ? 7 : 4 }, b(path)))
}

function toRow(file, indent, options) {
  if(options.fractions)
	return tr(
    td(filename(file, indent, options)),
    td(fraction(file.after.branches, file.before.branches)),
		td(percentage(file.after.branches, file.before.branches)),
		td(fraction(file.after.functions, file.before.functions)),
		td(percentage(file.after.functions, file.before.functions)),
		td(fraction(file.after.lines, file.before.lines)),
		td(percentage(file.after.lines, file.before.lines))
  );
  else return tr(
    td(filename(file, indent, options)),
		td(percentage(file.after.branches, file.before.branches)),
		td(percentage(file.after.functions, file.before.functions)),
		td(percentage(file.after.lines, file.before.lines))
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

function fraction(item, beforeItem) {
  const value = `${item.hit}/${item.found}`
  const beforeValue = `${beforeItem.hit}/${beforeItem.found}`

  return fragment(del(beforeValue), " ", b(value));
}

function percentage(item, beforeItem) {
	if (!item || !beforeItem) {
		return "N/A"
  }
  const round = (val) => val.toFixed(2).replace(/\.0*$/, "")

  const value = item.found === 0 ? 100 : (item.hit / item.found) * 100
  const beforeValue = beforeItem.found === 0 ? 100 : (beforeItem.hit / beforeItem.found) * 100

  return fragment(del(`${round(beforeValue)}%`), " ", b(`${round(value)}%`))
}

