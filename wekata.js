const KOA = require('koa')
const IO = require('koa-socket-2')
const fs = require('fs')
const jsp = JSON.parse
const jss = JSON.stringify
const profileCheck =/\/profile\/([a-zA-Z]{1,}-[a-zA-Z]{1,})/
const profilPicCheck = /\/profile\/([a-zA-Z]{1,}-[a-zA-Z]{1,})\/([a-zA-Z0-9-]{1,}\.jpeg|png|jpg|PNG)/
const kataSocket = new IO({
    namespace: 'katasocket'
})
let profiles = ''
    let profilesStream = fs.createReadStream('./userslist.weson', {autoClose: true})
    profilesStream.on('data', data =>{
      profiles += data
    })
    profilesStream.on('end', ()=>{
      console.log(profiles)
      profiles = jsp(profiles)
    })
const wekata = new KOA()
wekata.use(ctx=>{
  if(ctx.url === '/favicon.ico') return
  if(ctx.url === '/'){
    ctx.type = 'html'
    ctx.body = fs.createReadStream('./weApp.html', {autoClose: true})
  }
  if(/\.js/.test(ctx.url)){
    ctx.type = "application/javascript"
    ctx.body = fs.createReadStream('./js' + ctx.url, {autoClose:true})
  }
  if(/\.css/.test(ctx.url)){
    ctx.type = "css"
    ctx.body = fs.createReadStream('./css' + ctx.url, {autoClose:true})
  }
  if(/\.(png|PNG|jpeg|jpg)/.test(ctx.url)){
    ctx.type = 'image/*'
    if(profilPicCheck.test(ctx.url)){
      ctx.body = fs.createReadStream('.' + ctx.url, {autoClose: true})
    }else{
      ctx.body = fs.createReadStream('./images/' + ctx.url, {autoClose: true})
    }
  }
  if(ctx.url === '/fetch-profiles'){
    console.log('fetched')
    ctx.type = 'application/json'
    ctx.body = profiles
  }
  //VISITER UN PROFILE
  if(profileCheck.test(ctx.url)){
    let profileRequest = profileCheck.exec(ctx.url)[1]
    ctx.body = readDirCreateURLs(profileRequest)
    console.log(profileRequest)
  }
})

kataSocket.on('connection', (ctx)=>{
  console.log('socket connected')
})

kataSocket.on('create-profile', (ctx)=>{
  let profileData = ctx.data
  /* profileData = {
    firstName: "name",
    lastName: "lastname",
    profilPic: "buffer",
    imgType: ""
  } */
  let user = {
    firstName: profileData.firstName,
    lastName: profileData.lastName
  }
  let currentUserList = ""
  let currentUserStream = fs.createReadStream('./userslist.weson', {encoding: 'utf8'})
  currentUserStream.on('data', data=>{
    currentUserList += data
  })
  currentUserStream.on('end', ()=>{
    currentUserList = jsp(currentUserList)
    let y = 0
    for(let i = 0; i<=currentUserList.length; i++){
      if( currentUserList[i] !== undefined && currentUserList[i].lastName === profileData.lastName ){
        y++
      }
    }
    if(y !== 0){
      console.log('le profil extist')
      ctx.socket.emit('error-msg', 'le profile existe')
    }else{
      currentUserList.push(user)
      const updateList = fs.createWriteStream('./userslist.weson', {encoding: 'utf8'})
      updateList.write(jss(currentUserList))
      updateList.end()
      let fullName = profileData.firstName+'-'+profileData.lastName
      let profilPic = 'avatar.'+ profileData.imgType
      saveAndCreate(fullName, {name: profilPic, buffer: profileData.profilPic})
      profiles.push(user)
    }
  })
})
kataSocket.on('add-image', ctx => {
  let picData = ctx.data
  /* picData = {
    fullname: "full-name",
    name: "name",
    buffer: "buffer"
  } */
  saveAndCreate(picData.fullname, {name: picData.name, buffer: picData.buffer})
})

const saveAndCreate = (name, image)=>{
  if(fs.existsSync('./images/' + name)){
    const newFile = fs.createWriteStream('./images/'+name+'/' + image.name, {encoding: "binary"})
    newFile.write(image.buffer)
    newFile.end()
  }else{
    fs.mkdirSync('./images/' + name)
    saveAndCreate(name, image)
  }
};

const readDirCreateURLs = (name)=>{
  if(fs.existsSync('./images/' + name)){
    let profileImagesURLS = fs.readdirSync('./images/'+ name).map(image =>{
      return './'+name+'/'+image
    })
    return profileImagesURLS
  }else{
    //ctx.socket.emit('error-msg')?
    return {profileError: "this profile does not exist."}
  }
}


kataSocket.attach(wekata)
wekata.listen(2019, ()=>{console.log('listening on port 2019')})