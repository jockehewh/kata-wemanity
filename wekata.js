const KOA = require('koa') // koa est une libraire comme Express.

const IO = require('koa-socket-2') // koa-socket-2 est une envelope pour la librairie Socket.io.

const fs = require('fs') // fs est une module NodeJS qui permet d'accéder au système de fichier.

const jsp = JSON.parse // jsp est un raccourci vers méthode JSON.parse.

const jss = JSON.stringify//jss est un raccourci vers méthode JSON.stringify.

const profileCheck =/\/profile\/([a-zA-Z]{1,}-[a-zA-Z]{1,})/ //c'est un expréssion régulière qui verifie que l'url est bien formatée comme je l'ai choisi (/profile/prenom-nomDeFamille)

const profilPicCheck = /\/profile\/([a-zA-Z]{1,}-[a-zA-Z]{1,})\/([a-zA-Z0-9-]{1,}\.jpeg|png|jpg|PNG|gif)/ //c'est une expresion régulière qui verifie que l'url est bien formatée
// comme je l'ai choisi (/profile/prenom-nomDeFamille) en verifiant qu'lle se termine bien par une format image (jpeg, jpg, png, PNG).

const kataSocket = new IO({
    namespace: 'katasocket'
}) //kataSocket est objet de type socket généré par koa-socket-2. qui permet un communication bilatéral entre le serveur et le client.

    let profiles = ''
    let profilesStream = fs.createReadStream('./userslist.weson', {autoClose: true})
    // profilesStream est un flux de données qui lit mon fichier de base de donnée.
    profilesStream.on('data', data =>{
      profiles += data
    })
    profilesStream.on('end', ()=>{
      profiles = jsp(profiles)
      //le flux de données "profilesStream" est ensuite enreistré dans la variable "profiles"
    })
const wekata = new KOA() //wekata est un objet issus de la librairie koa, son role est un role de serveur web. comme app = express()

wekata.use(ctx=>{
  //cette première fonction à pour role le routage des requtes HTTP reçues
  if(ctx.url === '/favicon.ico') return //comme il n'ya pas d'icône "favicon.ico" sur le serveur je termine la requête quand elle arrive.
  if(ctx.url === '/'){
    //si l'url est l'origine de l'application j'envois le fichier "weApp.html" sous forme d'un flux de données
    ctx.type = 'html'
    ctx.body = fs.createReadStream('./weApp.html', {autoClose: true})
  }
  if(/\.js/.test(ctx.url)){
    // si l'url se termine en ".js" je change le type MIME. Ce dernier doit correspondre au type de données qui à été demandé lors de la requête
    ctx.type = "application/javascript"
    ctx.body = fs.createReadStream('./js' + ctx.url, {autoClose:true})
  }
  if(/\.css/.test(ctx.url)){
    // si l'url se termine en ".css" je change type MIME. Ce dernier doit correspondre au type de données qui à été demandé lors de la requête
    ctx.type = "css"
    ctx.body = fs.createReadStream('./css' + ctx.url, {autoClose:true})
  }
  if(/\.(png|PNG|jpeg|jpg|gif)/.test(ctx.url)){
    // si l'url se termine en ".jpeg", ".jpg", ".png" ".PNG" je change type MIME
    ctx.type = 'image/*'
    if(profilPicCheck.test(ctx.url)){
      ctx.body = fs.createReadStream('.' + ctx.url, {autoClose: true})
    }else{
      ctx.body = fs.createReadStream('./images/' + ctx.url, {autoClose: true})
    }
  }
  if(ctx.url === '/fetch-profiles'){
    //si l'url est strictement égale à '/fetch-profiles' je renvois tout les profils qui sont enregistés dans la variable "profiles"
    ctx.type = 'application/json'
    ctx.body = profiles
  }
  //VISITER UN PROFILE
  if(profileCheck.test(ctx.url)){
    //si l'url est bien formaté ("/profil/prenom-nom") alors je lis le dossier correspondant au profil demandé et je renvois la liste des images sous forme d'url
    let profileRequest = profileCheck.exec(ctx.url)[1]
    ctx.body = readDirCreateURLs(profileRequest)
  }
})

kataSocket.on('connection', (ctx)=>{
  //lors d'une connection, j'affiche dans la console du serveur un message ('socket connected')
  console.log('socket connected')
})

kataSocket.on('create-profile', (ctx)=>{
  //lorsque je reçois la commande 'create-profile' je crée un profile de la façon suivante.
  //la base de donnée est dabor comparée au nom de famille reçu. si ce nom de famille existe déja, le profile n'est pas crée
  //sinon le prénom et le nom de famille sont inscrit dans la basse de données (ligne: 110)
  //(ligne 115) j'appel la fonction "saveAndCreate" avec comme argument, le nom complet de l'utilisateur et un objet contenant l'image sous forme de flux de donnée et le nom de l'image et son titre.
  let profileData = ctx.data
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
      profiles.push(user)// j'ajoute manuellement l'utilisateur à la liste au tableau de "profiles" pour limiter l'accès au système de fichiers
    }
  })
})
kataSocket.on('add-image', ctx => {
  //lorsque je reçois la commande 'add-image' j'appel la fonction "saveAndCreate" avec comme paramettre le nom complet
  // de l'utilisateur et un objet contenant le titre l'image et l'image elle même sous forme d'un flux de données
  let picData = ctx.data
  saveAndCreate(picData.fullname, {name: picData.name, buffer: picData.buffer})
})

const saveAndCreate = (name, image)=>{
  /* 
    la Fonction "saveAndCreate" accepte deux paramettre:
    name: qui est le nom complet de l'utilisateur.
    image: qui est un objet contenant le titre l'image et l'image elle même sous forme d'un flux de données
    cette fonction ne retourne rien
  */
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
  /* 
    la fonction "readDirCreateURLs" accept un paramettre qui est le nom complet de l'utilisateur.
    cette fonction retourne une liste d'URL
 */
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


kataSocket.attach(wekata) // ici j'attache le webSocket au serveur web créer avec KOA

wekata.listen(2019, ()=>{console.log('listening on port 2019')})// ensuite je met le serveur en écoute sur le port 2019