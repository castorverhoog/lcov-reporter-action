import { promises as fs } from "fs"
import core from "@actions/core"
import { GitHub, context } from "@actions/github"

import { parse } from "./lcov"
import { diff } from "./comment"

const MAX_COMMENT_SIZE = 65536;
const COVERAGE_HEADER = ":loop: **Code coverage**\n\n";
const CHECK_RUN_TITLE = "Code Coverage Report";

async function main() {
	const token = core.getInput("github-token")
	const lcovFile = core.getInput("lcov-file") || "./coverage/lcov.info"
	const baseFile = core.getInput("lcov-base")

	const raw = await fs.readFile(lcovFile, "utf-8").catch(err => null)
	if (!raw) {
		console.log(`No coverage report found at '${lcovFile}', exiting...`)
		return
	}

	const baseRaw = baseFile && await fs.readFile(baseFile, "utf-8").catch(err => null)
	if (baseFile && !baseRaw) {
		console.log(`No coverage report found at '${baseFile}', ignoring...`)
	}

	const options = {
		repository: context.payload.repository.full_name,
		commit: context.payload.pull_request.head.sha,
		prefix: `${process.env.GITHUB_WORKSPACE}/`,
		head: context.payload.pull_request.head.ref,
		base: context.payload.pull_request.base.ref,
	}
	const coverageHeader = `${context.workflow}: ${COVERAGE_HEADER}`;
	const lcov = await parse(raw)
	const baselcov = baseRaw && await parse(baseRaw)
	let body = coverageHeader + diff(lcov, baselcov, options)

	console.log(`Body length: ${body.length}`);

	const ghClient = new GitHub(token);
	body = body.length > MAX_COMMENT_SIZE ? coverageHeader + diff(lcov, baselcov, {...options, headersOnly: true}) : body;

	const checkRes = await ghClient.checks.create({
		repo: context.repo.repo,
		owner: context.repo.owner,
		name: CHECK_RUN_TITLE,
		status: "completed",
		head_sha: context.payload.pull_request.head.sha,
		conclusion: "success",
		output: {
			title: CHECK_RUN_TITLE,
			summary: body
		}
	});

	console.log(`Report created at: ${checkRes.data.details_url}`);
	
	await deletePreviousComments(ghClient, coverageHeader);

	await ghClient.issues.createComment({
		repo: context.repo.repo,
		owner: context.repo.owner,
		issue_number: context.payload.pull_request.number,
		body: body.length > MAX_COMMENT_SIZE ? COVERAGE_HEADER + `See ${checkRes.data.details_url} for coverage` : body
	});
}

async function deletePreviousComments(ghClient, whatToLookFor) {
	const { data } = await ghClient.issues.listComments({
		...context.repo,
		per_page: 100,
		issue_number: context.payload.pull_request.number,
	})
	return Promise.all(
		data
			.filter(
				(c) =>
					c.user.login === "github-actions[bot]" &&
					c.body.startsWith(whatToLookFor),
			)
			.map((c) =>
				ghClient.issues.deleteComment({ ...context.repo, comment_id: c.id }),
			),
	)
}

main().catch(function(err) {
	console.log(err)
	core.setFailed(err.message)
})
