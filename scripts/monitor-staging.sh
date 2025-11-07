#!/bin/bash
# Staging Environment Health Monitor
# Linux/Mac version

set -e

# Configuration
SERVER_HOST="ieclub.online"
STAGING_PORT=3001
HEALTH_ENDPOINT="/health"
PM2_PROCESS_NAME="staging-backend"
SSH_USER="root"
MAX_RESTART_ATTEMPTS=5

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Flags
AUTO_FIX=false
DETAILED=false
CONTINUOUS=false
INTERVAL=300

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-fix)
            AUTO_FIX=true
            shift
            ;;
        --detailed)
            DETAILED=true
            shift
            ;;
        --continuous)
            CONTINUOUS=true
            shift
            ;;
        --interval)
            INTERVAL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--auto-fix] [--detailed] [--continuous] [--interval SECONDS]"
            exit 1
            ;;
    esac
done

# Create logs directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/staging-monitor.log"

# Helper functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

info() {
    echo -e "${CYAN}INFO: $1${NC}"
    log "INFO: $1"
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
    log "SUCCESS: $1"
}

fail() {
    echo -e "${RED}ERROR: $1${NC}"
    log "ERROR: $1"
}

warn() {
    echo -e "${YELLOW}WARNING: $1${NC}"
    log "WARNING: $1"
}

# Test health endpoint
test_health() {
    info "Checking staging environment health..."
    
    local health_response
    health_response=$(ssh ${SSH_USER}@${SERVER_HOST} "curl -s http://localhost:${STAGING_PORT}${HEALTH_ENDPOINT}" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        fail "Failed to connect to health endpoint"
        return 1
    fi
    
    local status=$(echo "$health_response" | jq -r '.status' 2>/dev/null)
    
    if [ "$status" = "ok" ]; then
        success "Health check passed"
        
        if [ "$DETAILED" = true ]; then
            local environment=$(echo "$health_response" | jq -r '.environment')
            local uptime=$(echo "$health_response" | jq -r '.uptime' | cut -d. -f1)
            
            echo -e "${GRAY}  Environment: $environment${NC}"
            echo -e "${GRAY}  Uptime: $uptime seconds${NC}"
        fi
        
        return 0
    else
        warn "Health check returned abnormal status: $status"
        return 1
    fi
}

# Test PM2 status
test_pm2_status() {
    info "Checking PM2 process status..."
    
    local pm2_output
    pm2_output=$(ssh ${SSH_USER}@${SERVER_HOST} "pm2 jlist" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        fail "Failed to get PM2 status"
        return 1
    fi
    
    local process_status=$(echo "$pm2_output" | jq -r ".[] | select(.name==\"$PM2_PROCESS_NAME\") | .pm2_env.status" 2>/dev/null)
    
    if [ -z "$process_status" ]; then
        fail "PM2 process not found: $PM2_PROCESS_NAME"
        return 1
    fi
    
    if [ "$process_status" = "online" ]; then
        success "PM2 process is online"
        
        if [ "$DETAILED" = true ]; then
            local restarts=$(echo "$pm2_output" | jq -r ".[] | select(.name==\"$PM2_PROCESS_NAME\") | .pm2_env.restart_time")
            local memory=$(echo "$pm2_output" | jq -r ".[] | select(.name==\"$PM2_PROCESS_NAME\") | .monit.memory")
            local cpu=$(echo "$pm2_output" | jq -r ".[] | select(.name==\"$PM2_PROCESS_NAME\") | .monit.cpu")
            
            # Convert memory to MB
            memory_mb=$(echo "scale=2; $memory / 1024 / 1024" | bc)
            
            echo -e "${GRAY}  Restarts: $restarts${NC}"
            echo -e "${GRAY}  Memory: ${memory_mb} MB${NC}"
            echo -e "${GRAY}  CPU: ${cpu}%${NC}"
            
            # Check if too many restarts
            if [ "$restarts" -gt "$MAX_RESTART_ATTEMPTS" ]; then
                warn "Process has restarted too many times ($restarts)"
            fi
        fi
        
        return 0
    else
        fail "PM2 process status abnormal: $process_status"
        return 1
    fi
}

# Auto fix
auto_fix() {
    info "Attempting auto-fix..."
    
    info "Restarting PM2 process..."
    ssh ${SSH_USER}@${SERVER_HOST} "pm2 restart $PM2_PROCESS_NAME"
    
    if [ $? -eq 0 ]; then
        success "PM2 process restarted successfully"
        
        info "Waiting for service to start..."
        sleep 10
        
        if test_health; then
            success "Fix successful! Service restored"
            return 0
        else
            warn "Service still abnormal after restart"
            return 1
        fi
    else
        fail "Failed to restart PM2 process"
        return 1
    fi
}

# Generate report
generate_report() {
    local health_ok=$1
    local pm2_ok=$2
    
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}Staging Environment Monitor Report${NC}"
    echo -e "${CYAN}=========================================${NC}"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    echo -e "${YELLOW}Check Items:${NC}"
    echo -n "  Health Check: "
    if [ $health_ok -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
    else
        echo -e "${RED}FAIL${NC}"
    fi
    
    echo -n "  PM2 Status:   "
    if [ $pm2_ok -eq 0 ]; then
        echo -e "${GREEN}NORMAL${NC}"
    else
        echo -e "${RED}ABNORMAL${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    
    if [ $health_ok -eq 0 ] && [ $pm2_ok -eq 0 ]; then
        success "Staging environment running normally"
        return 0
    else
        fail "Staging environment has issues"
        return 1
    fi
}

# Single check
run_check() {
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}Starting Monitor Check${NC}"
    echo -e "${CYAN}=========================================${NC}"
    echo ""
    
    test_health
    local health_result=$?
    
    test_pm2_status
    local pm2_result=$?
    
    generate_report $health_result $pm2_result
    local overall_result=$?
    
    if [ $overall_result -ne 0 ] && [ "$AUTO_FIX" = true ]; then
        warn "Issues detected, starting auto-fix..."
        auto_fix
    fi
    
    return $overall_result
}

# Continuous monitoring
continuous_monitoring() {
    info "Starting continuous monitoring mode (interval: ${INTERVAL}s)"
    info "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        run_check
        
        echo ""
        info "Waiting ${INTERVAL} seconds for next check..."
        echo ""
        
        sleep $INTERVAL
    done
}

# Main
main() {
    echo -e "${CYAN}IEClub Staging Environment Monitor${NC}"
    echo -e "${GRAY}Server: $SERVER_HOST${NC}"
    echo -e "${GRAY}Port: $STAGING_PORT${NC}"
    echo ""
    
    if [ "$CONTINUOUS" = true ]; then
        continuous_monitoring
    else
        run_check
        exit $?
    fi
}

# Run
main
