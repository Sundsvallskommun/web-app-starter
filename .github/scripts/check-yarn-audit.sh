#!/usr/bin/env bash

set -euo pipefail

package_name="${1:?Pass backend, frontend or admin}"
policy_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
repository_root="${2:-$policy_root}"
allowlist_path="$policy_root/.github/audit-allowlist.json"
package_directory="$repository_root/$package_name"

if [[ ! -d "$package_directory" ]]; then
  echo "Unknown package directory: $package_name" >&2
  exit 1
fi

expires_on="$(jq -er '.expiresOn' "$allowlist_path")"
today="$(date -u +%F)"
if [[ "$today" > "$expires_on" ]]; then
  echo "Production-audit allowlist expired on $expires_on; review and renew or remove its entries." >&2
  exit 1
fi

audit_json="$(cd "$package_directory" && yarn audit --groups dependencies --json 2>/dev/null || true)"
if ! jq -e 'select(.type == "auditSummary")' <<<"$audit_json" >/dev/null; then
  echo "Yarn did not return a valid audit summary for $package_name." >&2
  exit 1
fi

unexpected_findings=0
allowed_findings=0
while IFS=$'\t' read -r advisory_id severity module_name dependency_path; do
  if jq -e \
    --arg advisory_id "$advisory_id" \
    --arg dependency_path "$dependency_path" \
    --arg package_name "$package_name" \
    'any(((if (.sharedPackages | index($package_name)) then .shared else [] end) +
      (.packages[$package_name] // []))[];
      .id == $advisory_id and
      (.pathPrefixes as $prefixes |
        any($prefixes[]; . as $prefix | $dependency_path | startswith($prefix))))' \
    "$allowlist_path" >/dev/null; then
    allowed_findings=$((allowed_findings + 1))
    continue
  fi

  echo "Unexpected $severity advisory $advisory_id in $module_name via $dependency_path" >&2
  unexpected_findings=$((unexpected_findings + 1))
done < <(
  jq -r \
    'select(.type == "auditAdvisory") |
      [.data.advisory.github_advisory_id, .data.advisory.severity, .data.advisory.module_name, .data.resolution.path] |
      @tsv' \
    <<<"$audit_json" | sort -u
)

if ((unexpected_findings > 0)); then
  echo "$package_name has $unexpected_findings production advisory finding(s) outside the allowlist." >&2
  exit 1
fi

echo "$package_name production audit passed ($allowed_findings time-limited allowlisted finding(s), expires $expires_on)."
