#!/bin/bash
cd backend && flask run &
cd ../whatsapp-client && node index.js
