-- Example SCM plugin scaffold.
--
-- Each operation listed in plugin.json's "operations" array must be
-- exported as a function on `M`. The dispatcher (src/scm/ in Claudette)
-- calls them with a `args` table and expects a kind-specific shape back.
--
-- Reference: see plugins/scm-github/init.lua in the Claudette repo for
-- the canonical PR list / CI status shape.

local M = {}

function M.list_pull_requests(args)
    -- args: { branch = "<optional branch filter>" }
    -- Replace this with a real `host.exec` call to your provider's CLI,
    -- decode the JSON, and translate into Claudette's PR shape.
    host.log("example SCM plugin: list_pull_requests called for branch " .. tostring(args.branch))
    return {}
end

return M
