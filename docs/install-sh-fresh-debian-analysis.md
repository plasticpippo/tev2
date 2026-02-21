# install.sh Fresh Debian Installation Issues Analysis

**Analysis Date:** 2026-02-21  
**Script:** install.sh (52240 chars, 1588 lines)  
**Target:** Fresh Debian OS Installation

## Executive Summary

This analysis identifies potential issues that would cause the install.sh script to fail on a fresh Debian installation. The script is well-structured with good error handling, but has several critical gaps that could cause failures on minimal Debian systems.

---

## Critical Issues (Will Cause Script Failure)

### 1. Missing `openssl` Dependency Check
**Location:** Lines 166-171  
**Code:**
```bash
generate_secure_password() {
    openssl rand -base64 24 | tr -d '/+=' | head -c 32
}

generate_jwt_secret() {
    openssl rand -hex 64
}
```
**Problem:** The script uses `openssl` to generate secure passwords and JWT secrets, but `openssl` is not checked in prerequisites (lines 594-607) and is not installed by [`install_basic_tools()`](install.sh:612). On a minimal Debian install, `openssl` is typically NOT installed by default.

**Impact:** Script will fail when attempting to generate JWT secret or database password in interactive mode.

**Recommended Fix:** Add `openssl` to the required commands check and install it via `apt-get install openssl`.

---

### 2. Missing `awk` Dependency Check
**Location:** Line 1124  
**Code:**
```bash
lan_ip=$(hostname -I | awk '{print $1}')
```
**Problem:** The script uses `awk` to parse the LAN IP address, but `awk` is not checked in prerequisites. While `awk` is usually installed (via `gawk` or `mawk`), a truly minimal Debian might not have it.

**Impact:** Script will fail when user selects option 2 (LAN IP) for URL configuration.

**Recommended Fix:** Add `awk` (or `gawk`/`mawk`) to the required commands check.

---

### 3. Missing `hostname` Command Check
**Location:** Line 1124  
**Code:**
```bash
lan_ip=$(hostname -I | awk '{print $1}')
```
**Problem:** The `hostname` command might not be available on minimal Debian installs. The `hostname` package provides this command.

**Impact:** Script will fail when user selects option 2 (LAN IP) for URL configuration.

**Recommended Fix:** Add `hostname` to the required commands check or use an alternative method to get IP (e.g., `ip addr` or `ifconfig`).

---

### 4. `gpg` Not Available During Docker Installation
**Location:** Line 789  
**Code:**
```bash
curl -fsSL "https://download.docker.com/linux/${docker_distro}/gpg" | $SUDO gpg --dearmor -o "$keyring_dir/docker.gpg" 2>/dev/null
```
**Problem:** The script uses `gpg` to add Docker's GPG key, but `gpg` (provided by `gnupg` package) is installed AFTER this line in the [`install_docker_debian()`](install.sh:756) function (line 766-770). The order is correct, but the error suppression (`2>/dev/null`) hides potential GPG failures.

**Impact:** If GPG key import fails silently, subsequent Docker package installation will fail with signature verification errors.

**Recommended Fix:** Remove or reduce error suppression on GPG operations, and verify the keyring file was created successfully.

---

### 5. Docker Repository URL Check Before curl is Installed
**Location:** Lines 781, 798  
**Code:**
```bash
if curl -fsSL "https://download.docker.com/linux/ubuntu/dists/$(. /etc/os-release && echo "$VERSION_CODENAME")/" &>/dev/null; then
```
**Problem:** The script uses `curl` to check if Docker repositories exist for a specific distribution, but this happens inside [`install_docker_debian()`](install.sh:756) which is called AFTER [`install_basic_tools()`](install.sh:612). However, if `curl` installation fails in `install_basic_tools`, this line will fail.

**Impact:** Script will fail if curl installation failed silently.

**Recommended Fix:** Verify curl is available before using it, or use wget as fallback.

---

## High Priority Issues (Likely to Cause Problems)

### 6. Silent Package Installation with `-qq` Flag
**Location:** Lines 620-621, 763, 811-812  
**Code:**
```bash
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq curl wget
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
**Problem:** The `-qq` flag suppresses almost all output, making it extremely difficult to diagnose package installation failures. On a fresh Debian, there could be repository issues, network problems, or package conflicts that are completely hidden.

**Impact:** Script fails silently or with cryptic error messages, making troubleshooting very difficult.

**Recommended Fix:** Use `-q` instead of `-qq` for important operations, or capture output to a log file while still showing errors.

---

### 7. Hardcoded Fallback Distribution Codenames
**Location:** Lines 801-804  
**Code:**
```bash
if [[ "$docker_distro" == "ubuntu" ]]; then
    codename="jammy"  # Ubuntu 22.04 LTS (most compatible)
else
    codename="bookworm"  # Debian 12
fi
```
**Problem:** If the script cannot detect the distribution codename, it falls back to hardcoded values. "jammy" (Ubuntu 22.04) and "bookworm" (Debian 12) may not be compatible with future Docker releases or older Debian versions.

**Impact:** Docker installation may fail if the fallback codename doesn't have matching Docker packages.

**Recommended Fix:** Add a check to verify the Docker repository exists for the fallback codename before using it, or prompt the user.

---

### 8. Missing `VERSION_CODENAME` on Minimal Debian
**Location:** Line 795  
**Code:**
```bash
codename=$(. /etc/os-release && echo "$VERSION_CODENAME")
```
**Problem:** On some minimal Debian installations, `VERSION_CODENAME` might not be set in `/etc/os-release`. This is especially true for testing/unstable branches or custom Debian builds.

**Impact:** The `codename` variable will be empty, triggering the fallback logic (issue #7).

**Recommended Fix:** Add a fallback to read from `/etc/debian_version` or use `lsb_release -c` if available.

---

### 9. Docker Group Membership Requires Re-login
**Location:** Lines 1016-1019  
**Code:**
```bash
if ! groups "$current_user" | grep -q docker; then
    print_info "Adding user '$current_user' to docker group..."
    $SUDO usermod -aG docker "$current_user"
    print_warning "You may need to log out and log back in for group changes to take effect"
```
**Problem:** The script adds the user to the docker group but continues execution. The warning is displayed, but the script will fail at line 1328 when it tries to run `docker info` without sudo because the group membership hasn't taken effect yet.

**Impact:** Script will fail to run docker commands without sudo, even though the user was added to the docker group.

**Recommended Fix:** After adding user to docker group, either:
1. Use `newgrp docker` in a subshell
2. Continue using sudo for the remainder of the script
3. Prompt user to re-login and re-run the script

---

### 10. Docker Daemon Start Fallback is Unreliable
**Location:** Lines 1039-1042  
**Code:**
```bash
else
    $SUDO dockerd &
    print_success "Docker daemon started"
fi
```
**Problem:** Starting `dockerd` directly in the background is a last-resort fallback that:
1. Doesn't verify dockerd started successfully
2. Doesn't handle existing dockerd processes
3. May leave orphan processes
4. Won't survive a reboot

**Impact:** Docker might not be properly started, leading to failures in subsequent commands.

**Recommended Fix:** Add proper process checking and error handling for the dockerd fallback.

---

## Medium Priority Issues (May Cause Problems)

### 11. Fragile JSON Parsing with grep
**Location:** Lines 1397-1400  
**Code:**
```bash
unhealthy=$($docker_cmd compose ps --format json 2>/dev/null | \
    grep -c '"Health":"unhealthy"' 2>/dev/null) || unhealthy=0
starting=$($docker_cmd compose ps --format json 2>/dev/null | \
    grep -c '"Health":"starting"' 2>/dev/null) || starting=0
```
**Problem:** Using grep to parse JSON is fragile. The JSON format from `docker compose ps` might vary between Docker versions. Additionally, `jq` would be more reliable but isn't installed.

**Impact:** Health checks might not work correctly, leading to incorrect status reporting.

**Recommended Fix:** Either install `jq` for proper JSON parsing, or use Docker's built-in health check commands.

---

### 12. Fragile Service Count in docker-compose.yml
**Location:** Line 1419  
**Code:**
```bash
expected=$(grep -c '^\s*[a-z]' docker-compose.yml 2>/dev/null) || expected=3
```
**Problem:** This grep pattern attempts to count services by matching lines starting with lowercase letters. This is extremely fragile and will:
1. Count non-service lines (comments, other YAML content)
2. Miss services with uppercase names
3. Fail with different YAML formatting

**Impact:** The script might wait for the wrong number of services to start.

**Recommended Fix:** Use `docker compose config --services | wc -l` to get the actual service count.

---

### 13. Missing Check for `sort -V` Support
**Location:** Line 206  
**Code:**
```bash
if [[ "$(printf '%s\n' "$current" "$new" | sort -V | head -n1)" != "$new" ]]; then
```
**Problem:** The `-V` (version sort) option is a GNU extension. While it should work on Debian, it's not POSIX-compliant and might not work on all systems.

**Impact:** Version comparison might fail or produce incorrect results.

**Recommended Fix:** The script already targets Debian specifically, so this is low risk. However, a fallback version comparison function could be added.

---

### 14. `date -I` Option Dependency
**Location:** Lines 216, 338  
**Code:**
```bash
echo "INSTALL_DATE=$(date -I)" >> .version
echo "# === Added during upgrade ($(date -I)) ===" >> "$env_file"
```
**Problem:** The `-I` (ISO date format) option is a GNU extension. While it should work on Debian, it's not POSIX-compliant.

**Impact:** Low risk on Debian, but could fail on other systems.

**Recommended Fix:** Use `date +%Y-%m-%d` for better portability.

---

### 15. IP Address Detection May Return Wrong Interface
**Location:** Line 1124  
**Code:**
```bash
lan_ip=$(hostname -I | awk '{print $1}')
```
**Problem:** `hostname -I` returns all IP addresses separated by spaces, and the script takes the first one. On systems with multiple interfaces (e.g., docker0, virbr0, VPN tunnels), the first IP might not be the correct LAN IP.

**Impact:** The application URL might be set to an incorrect IP address.

**Recommended Fix:** Use `ip route get 1 | awk '{print $7; exit}'` to get the IP of the default route interface, or present a list of IPs for the user to choose.

---

### 16. Missing `tr` Command Check
**Location:** Lines 166, 1403-1404  
**Code:**
```bash
openssl rand -base64 24 | tr -d '/+=' | head -c 32
unhealthy=$(printf '%s' "$unhealthy" | tr -cd '0-9')
```
**Problem:** The `tr` command is used but not checked in prerequisites. While it's part of coreutils and should be available, it's not guaranteed on all minimal installs.

**Impact:** Script will fail if `tr` is not available.

**Recommended Fix:** Add `tr` to the required commands check (though it's very likely to be present).

---

## Low Priority Issues (Edge Cases)

### 17. Build Output Handling with tee
**Location:** Line 1360  
**Code:**
```bash
if $DOCKER_CMD compose up -d --build 2>&1 | tee /tmp/docker-build.log; then
```
**Problem:** The exit code of a pipeline is the exit code of the last command (`tee`), not `docker compose`. This means the `if` statement always succeeds unless `tee` fails.

**Impact:** Build failures might not be detected properly.

**Recommended Fix:** Use `set -o pipefail` (already set at line 20) or check `${PIPESTATUS[0]}` after the pipeline.

---

### 18. Missing `head` Command Check
**Location:** Line 166  
**Code:**
```bash
openssl rand -base64 24 | tr -d '/+=' | head -c 32
```
**Problem:** `head` is used but not checked. It's part of coreutils and should be available.

**Impact:** Low risk, but script will fail if not available.

**Recommended Fix:** Add to required commands check for completeness.

---

### 19. Potential Double Port in URL
**Location:** Line 1438  
**Code:**
```bash
local app_url="${URL}:${NGINX_PORT}"
```
**Problem:** If the user enters a URL that already includes a port (e.g., `http://192.168.1.100:8080`), the final URL will have two ports: `http://192.168.1.100:8080:80`.

**Impact:** Malformed URL displayed in success message.

**Recommended Fix:** Check if URL already contains a port before appending NGINX_PORT.

---

### 20. Missing `pg_isready` in Backend Container
**Location:** Line 409  
**Code:**
```bash
if docker compose exec -T backend pg_isready -h db -U totalevo_user > /dev/null 2>&1; then
```
**Problem:** The script runs `pg_isready` inside the backend container, but `pg_isready` is a PostgreSQL client tool. The backend container might not have PostgreSQL client tools installed.

**Impact:** Migration verification might fail or skip incorrectly.

**Recommended Fix:** Run `pg_isready` in the database container instead: `docker compose exec -T db pg_isready`.

---

### 21. Inconsistent Input Handling
**Location:** Line 520 vs lines 124-145  
**Code:**
```bash
read -p "Continue? (y/N) " -n 1 -r  # Line 520
# vs
prompt_input() { ... }  # Lines 124-145
```
**Problem:** The script has a `prompt_input` function and `confirm` function, but line 520 uses raw `read -p` instead.

**Impact:** Inconsistent behavior, especially in non-interactive mode.

**Recommended Fix:** Use the existing `confirm` function instead of raw `read`.

---

### 22. Curl Health Check Without Fallback
**Location:** Lines 381-385  
**Code:**
```bash
if command -v curl &> /dev/null; then
    if ! curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        print_warning "Backend health check failed (may still be starting)"
    fi
fi
```
**Problem:** Health check only uses curl. If curl isn't available, no health check is performed. Could use wget as fallback.

**Impact:** Minor - health check is optional anyway.

**Recommended Fix:** Add wget fallback for health check.

---

## Missing Dependencies Summary

The following commands are used in the script but NOT checked in the prerequisite check (lines 594-607):

| Command | Used At | Package | Criticality |
|---------|---------|---------|-------------|
| `openssl` | 166, 170 | openssl | **Critical** |
| `awk` | 1124 | gawk/mawk | **Critical** |
| `hostname` | 1124 | hostname | **Critical** |
| `gpg` | 789 | gnupg | High |
| `tr` | 166, 1403-1404 | coreutils | Medium |
| `head` | 166 | coreutils | Low |
| `sort` | 206 | coreutils | Low |
| `date` | 216, 338 | coreutils | Low |

---

## Recommended Fixes Summary

### Immediate Fixes Required

1. **Add `openssl`, `awk`, `hostname` to prerequisite checks** (lines 594-607)
2. **Install missing dependencies in [`install_basic_tools()`](install.sh:612)**:
   ```bash
   $SUDO apt-get install -y -qq curl wget openssl gawk hostname
   ```
3. **Handle docker group membership properly** - either use sudo for remainder of script or prompt for re-login
4. **Reduce error suppression** on critical operations (GPG key import, package installation)
5. **Use proper service count method**:
   ```bash
   expected=$($docker_cmd compose config --services 2>/dev/null | wc -l)
   ```

### Suggested Improvements

1. Replace `-qq` with `-q` for better error visibility
2. Add verification steps after critical operations
3. Use `ip route` for more reliable IP detection
4. Add wget fallback for curl operations
5. Fix the `pg_isready` command to run in the database container
6. Use the existing `confirm` function consistently

---

## Testing Recommendations

To properly test this script on a fresh Debian installation:

1. Use a Debian minimal/netinst ISO
2. Test in a VM with no pre-installed packages
3. Test both interactive and non-interactive modes
4. Test with and without network connectivity during Docker repo setup
5. Test with multiple network interfaces
6. Verify all error messages are meaningful and actionable