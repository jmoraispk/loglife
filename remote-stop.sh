ssh 5.161.234.127 '
  pm2 stop goal-bot || true &&
  systemctl stop goal-backend || true
'

