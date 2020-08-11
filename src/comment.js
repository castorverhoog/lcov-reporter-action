import { details, summary, b, fragment, table, tbody, tr, th } from "./html"

import { percentage } from "./lcov"
import { tabulate } from "./tabulate"
import { tabulateDiff } from "./tabulateDiff"

export function comment (lcov, options) {
	return fragment(
		`Coverage after merging ${b(options.head)} into ${b(options.base)}`,
		table(tbody(tr(th(percentage(lcov).toFixed(2), "%")))),
		"\n\n",
		options.headersOnly ? '' : details(summary("Coverage Report"), tabulate(lcov, options)),
	)
}

export function diff(lcov, before, options) {
	if (!before) {
		return comment(lcov, options)
	}

	const pbefore = percentage(before)
	const pafter = percentage(lcov)
	const pdiff = pafter - pbefore
	const nodiff = pdiff === 0
	const plus = nodiff ? "+" : ""
	const arrow =
		nodiff
			? ""
			: pdiff < 0
				? "▾"
				: "▴"
	if(nodiff) return fragment(
		`No difference in coverage between ${b(options.head)} and ${b(options.base)}.`,
		"\n\n",
		`Coverage: ${fragment(pafter.toFixed(2), "%")}`
	)

	return fragment(
		`Coverage after merging ${b(options.head)} into ${b(options.base)}`,
		table(tbody(tr(
			th(pafter.toFixed(2), "%"),
			th(arrow, " ", plus, pdiff.toFixed(2), "%"),
		))),
		"\n\n",
		options.headersOnly ? '': details(summary("Coverage Report"), tabulateDiff(lcov, before, options)),
	)
}
