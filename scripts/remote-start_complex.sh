ssh root@5.161.234.127 '
  cd ~/whatsapp-goal-bot &&
  git pull &&
  systemctl start goal-backend &&
  pm2 start index.js --name goal-bot
'
