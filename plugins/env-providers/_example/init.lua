-- Example env-provider plugin scaffold.
--
-- detect(args) -> bool : should this provider activate?
-- export(args) -> { env = {...}, watches = {...}, error = nil }

local M = {}

local function join(dir, name)
    return dir .. "/" .. name
end

function M.detect(args)
    -- Activate when an .example-config file exists at the worktree root.
    return host.file_exists(join(args.worktree, ".example-config"))
end

function M.export(args)
    -- Replace this with a real `host.exec` call to your tool, parse its
    -- output, and return env + watches.
    return {
        env = {
            EXAMPLE_PROVIDER = "active",
        },
        watches = { join(args.worktree, ".example-config") },
    }
end

return M
