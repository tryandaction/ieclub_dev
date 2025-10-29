# ==========================================================
# IEClub һ������ű� (v2.2)
# ==========================================================
#
# ����: �ύ���롢�������ϴ������� - һ����������������飡
#
# ʹ�÷���: ./deploy-local.ps1 -commitMessage "����ύ��Ϣ"
#
# v2.2 ���� (2025-10-26):
#   - �޸� PM2 ����·����src/server.js��
#   - �޸� Nginx SSL ֤�������
#   - �Զ�������� .env �����ļ�
#   - �ϴ�ǰ�˹������� (dist.zip)
# ==========================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$commitMessage
)

# --- ���� ---
$ProjectRoot = "C:\universe\GitHub_try\IEclub_dev"
$FrontendDir = "${ProjectRoot}\ieclub-frontend"
$BackendDir = "${ProjectRoot}\ieclub-backend"
$ServerUser = "root"
$ServerIP = "39.108.160.112"
$RemoteProjectPath = "/root/IEclub_dev"
$RemoteTempPath = "/tmp/dist.zip"

function Write-Log { param ([string]$Message, [string]$Color = "White"); Write-Host "[LOG] $Message" -ForegroundColor $Color }

Write-Log "IEClub һ������ʼ..." -Color Cyan

# --- ���� 1: Git ���� ---
Write-Log "���� 1/5: �ύ���뵽 Git..." -Color Yellow
Set-Location -Path $ProjectRoot
git add .
git commit -m $commitMessage
git push origin main
Write-Log "�����ύ���" -Color Green

# --- ���� 2: ���� H5 Ӧ�� ---
Write-Log "���� 2/5: ���� H5 Ӧ��..." -Color Yellow
Set-Location -Path $FrontendDir
Write-Log "  - ����ɵĹ�������..."
if (Test-Path -Path "dist") { Remove-Item -Path "dist" -Recurse -Force }

npm run build:h5
if ($LASTEXITCODE -ne 0) { Write-Log "H5 ����ʧ��" -Color Red; exit 1 }
Write-Log "H5 �������" -Color Green

# --- ���� 3: �ϴ�ǰ�˴��뵽������ ---
Write-Log "���� 3/5: �ϴ�ǰ�˴��뵽������..." -Color Yellow

# 1. ��� dist Ŀ¼
Write-Log "  - ���ǰ�˹�������..."
$ZipPath = "$FrontendDir\dist.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

# ʹ�� PowerShell �� Compress-Archive
Compress-Archive -Path "$FrontendDir\dist\*" -DestinationPath $ZipPath -Force
if ($LASTEXITCODE -ne 0 -and -not (Test-Path $ZipPath)) { 
    Write-Log "ǰ�˴��ʧ��" -Color Red
    exit 1 
}

# 2. �ϴ�ѹ������������
Write-Log "  - �ϴ�ǰ�˹������ﵽ������..."
scp "$ZipPath" "${ServerUser}@${ServerIP}:${RemoteTempPath}"
if ($LASTEXITCODE -ne 0) { Write-Log "ǰ�˹��������ϴ�ʧ��" -Color Red; exit 1 }

# 3. �ϴ�ǰ��Դ��
Write-Log "  - �ϴ�ǰ��Դ��..."
scp -r "$FrontendDir\src" "$FrontendDir\config" "$FrontendDir\package.json" "$FrontendDir\package-lock.json" "$FrontendDir\project.config.json" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-frontend/"
if ($LASTEXITCODE -ne 0) { Write-Log "ǰ��Դ���ϴ�ʧ��" -Color Red; exit 1 }

Write-Log "ǰ�˴����ϴ��ɹ�" -Color Green

# --- ���� 4: �ϴ���˴��뵽������ ---
Write-Log "���� 4/5: �ϴ���˴��뵽������..." -Color Yellow

Write-Log "  - �ϴ����Դ��..."
scp -r "$BackendDir\src" "$BackendDir\prisma" "$BackendDir\scripts" "$BackendDir\package.json" "$BackendDir\package-lock.json" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-backend/"
if ($LASTEXITCODE -ne 0) { Write-Log "��˴����ϴ�ʧ��" -Color Red; exit 1 }
Write-Log "��˴����ϴ��ɹ�" -Color Green

# --- ���� 5: �ڷ�������ִ�в��� ---
Write-Log "���� 5/5: �ڷ�������ִ�в���..." -Color Yellow

# �ϴ�����ű�
Write-Log "  - �ϴ�����ű�..."
scp "$ProjectRoot\deploy-master.sh" "${ServerUser}@${ServerIP}:/root/"
if ($LASTEXITCODE -ne 0) { Write-Log "����ű��ϴ�ʧ��" -Color Red; exit 1 }

# ִ�в���
Write-Log "  - ִ�з������˲���..."
ssh "${ServerUser}@${ServerIP}" "chmod +x /root/deploy-master.sh; bash /root/deploy-master.sh all"
if ($LASTEXITCODE -ne 0) { Write-Log "����������ʧ��" -Color Red; exit 1 }

Write-Log "�������������" -Color Green

Write-Log "һ������ȫ�����" -Color Cyan
Write-Log "����: https://ieclub.online" -Color Yellow


