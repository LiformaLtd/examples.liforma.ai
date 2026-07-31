# Runnable example services for examples.liforma.ai
# Sourced by ./start and ./stop

GALLERY_PORT=4000

# name|port — one port per example slug (vanilla and SvelteKit share ports)
EXAMPLE_SERVICES=(
	"gallery|4000"
	"spanish-tutor|4001"
	"guided-practice|4002"
)

# Liforma monorepo stack (api, player, CDN SDK preview) — used with ./start --local
PLATFORM_STACK_SERVICES=(
	"api|3001"
	"player|3002"
	"cdn|3010"
)

port_pids() {
	local port="$1"
	lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true
}

is_port_in_use() {
	[[ -n "$(port_pids "$1")" ]]
}

kill_port() {
	local port="$1"
	local pids
	pids="$(port_pids "$port")"
	if [[ -z "$pids" ]]; then
		return 0
	fi
	echo "  stopping process(es) on :$port ($pids)"
	kill $pids 2>/dev/null || true
	local i
	for i in 1 2 3 4 5; do
		if ! is_port_in_use "$port"; then
			return 0
		fi
		sleep 0.4
	done
	pids="$(port_pids "$port")"
	if [[ -n "$pids" ]]; then
		kill -9 $pids 2>/dev/null || true
	fi
}

status_line() {
	local port="$1"
	local url="$2"
	if is_port_in_use "$port"; then
		echo "running → $url"
	else
		echo "stopped"
	fi
}

print_status() {
	printf "%-22s %-6s %s\n" "SERVICE" "PORT" "STATUS"
	for entry in "${EXAMPLE_SERVICES[@]}"; do
		IFS='|' read -r name port <<<"$entry"
		printf "%-22s %-6s %s\n" "$name" "$port" "$(status_line "$port" "http://localhost:$port")"
	done
}

print_platform_stack_status() {
	printf "%-22s %-6s %s\n" "SERVICE" "PORT" "STATUS"
	for entry in "${PLATFORM_STACK_SERVICES[@]}"; do
		IFS='|' read -r name port <<<"$entry"
		printf "%-22s %-6s %s\n" "$name" "$port" "$(status_line "$port" "http://localhost:$port")"
	done
}

# Walk parents until we find the Liforma meta workspace (api + start script).
find_meta_root() {
	local dir="$1"
	while [[ "$dir" != "/" ]]; do
		if [[ -x "$dir/start" && -d "$dir/api.liforma.ai" && -d "$dir/player.liforma.ai" ]]; then
			META_ROOT="$dir"
			return 0
		fi
		dir="$(dirname "$dir")"
	done
	return 1
}

start_platform_stack_if_available() {
	if ! find_meta_root "$1"; then
		echo "warning: Liforma monorepo not found — start api (:3001), player (:3002), and cdn (:3010) manually" >&2
		return 0
	fi
	echo "Starting Liforma platform stack from $META_ROOT (api, player, cdn)…"
	"$META_ROOT/start" --only api,player,cdn
}

known_service_names() {
	local names=()
	local entry name _port
	for entry in "${EXAMPLE_SERVICES[@]}"; do
		IFS='|' read -r name _port <<<"$entry"
		names+=("$name")
	done
	echo "${names[*]}"
}

# Sets RESOLVED_SERVICE_NAME and RESOLVED_SERVICE_PORT on success.
resolve_service_target() {
	local target="$1"
	local entry name port
	for entry in "${EXAMPLE_SERVICES[@]}"; do
		IFS='|' read -r name port <<<"$entry"
		if [[ "$target" == "$name" ]] || [[ "$target" == "$port" ]]; then
			RESOLVED_SERVICE_NAME="$name"
			RESOLVED_SERVICE_PORT="$port"
			return 0
		fi
	done
	return 1
}

stop_service_by_port() {
	local name="$1"
	local port="$2"
	if is_port_in_use "$port"; then
		echo "stop $name (:$port)"
		kill_port "$port"
	else
		echo "skip $name — not running on :$port"
	fi
}
