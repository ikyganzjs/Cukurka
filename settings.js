const fs = require('fs')

// Whatsapp
global.owner = "6283139882434"
global.ownername = "Iky"
global.botname = "Iky Botz"
global.idSaluran = ''
global.p = ''
global.thumbUrl = "https://img1.pixhost.to/images/9147/647147914_encore.jpg",
global.title = "Iky Botz By Iky",
global.packname = 'Iky Botz [ Bot Private ]',
global.author = 'https://restapiikyjs.vercel.app/',
global.footer = "I am Iky Botz"
global.YouTube = "",
global.GitHub = "",
global.Telegram = "",
global.ChannelWA = "",
global.idch = ''
global.egg = "15" // Egg ID
global.nestid = "5" // nest ID
global.loc = "1" // Location ID
global.domain = "https://paneliky.pteroweb.my.id"
global.apikey = "ptla_80ge4kBdy7WV5YFum01VbkpvkeSDWorUPsy7Dr6UQDK" //ptla
global.capikey = "ptlc_dwOYqVW4v1dQUHLT13gQEFIh1HyUwOnclcnVqZz5Idx" //ptlc

// Telegram
global.TELEGRAM_TOKEN = '8243529445:AAGBeGWf_EqYOx2ySveFmaDIpVPfM3oQ_l4',
global.OWNER_ID = ["5995543569"]
global.telebot = "Iky Botz Tele",
global.ownertele = "https://wa.me/6283139882434"

global.subdomain = {
  "skypedia.qzz.io": {
    "zone": "59c189ec8c067f57269c8e057f832c74",
    "apitoken": "mZd-PC7t7PmAgjJQfFvukRStcoWDqjDvvLHAJzHF"
  }, 
  "pteroweb.my.id": {
    "zone": "714e0f2e54a90875426f8a6819f782d0",
    "apitoken": "vOn3NN5HJPut8laSwCjzY-gBO0cxeEdgSLH9WBEH"
  },
  "panelwebsite.biz.id": {
    "zone": "2d6aab40136299392d66eed44a7b1122",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "privatserver.my.id": {
    "zone": "699bb9eb65046a886399c91daacb1968",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "serverku.biz.id": {
    "zone": "4e4feaba70b41ed78295d2dcc090dd3a",
    "apitoken": "CcavVSmQ6ZcGSrTnOos-oXnawq4yf86TUhmQW29S"
  },
  "vipserver.web.id": {
    "zone": "e305b750127749c9b80f41a9cf4a3a53",
    "apitoken": "cpny6vwi620Tfq4vTF4KGjeJIXdUCax3dZArCqnT"
  }, 
  "mypanelstore.web.id": {
    "zone": "c61c442d70392500611499c5af816532",
    "apitoken": "uaw-48Yb5tPqhh5HdhNQSJ6dPA3cauPL_qKkC-Oa"
  }
}

global.userorkut = 'kyycodestore',
global.tokenweb = '2106797:RpEhM4C80LNFJ7SGrPYfZDcsQbIO3ljk'

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
 
