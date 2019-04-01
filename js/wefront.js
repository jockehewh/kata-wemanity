const jss = JSON.stringify //jss est un raccourci vers méthode JSON.stringify.

const jsp = JSON.parse //jsp est un raccourci vers méthode JSON.parse.

const x = m // réassignation de "m" (Mithril) vers "x" pour le coté pratique parce que autrement VSCode autocomplete le "m" en "matchmedia"

const mews = io('ws://localhost:2019/katasocket') // la variable "mews" est un "webSocket", pour cet exercice j'utilise la librairie Socket.io parce qu'elle gère les deconnexions et le reconnexions
/* 
  Vérification de présence de la clé 'profile' dans le localStorage
*/
if(localStorage.profile === undefined){
  localStorage.profile = false
} 
/* 
  Création du state
  un objet global qui référence les variables utilisées par l'application
*/
const state = {
  hasProfile: localStorage.profile,
}

const checkAndCreateProfile = (form)=>{
  /* 
    Fonction créatrice de profile d'utilisateur
    cette fonction prend en parametre le formulaire de création d'utilisateur.
    la fonction de cette fonction est de vérifié que les champs nécéssaire à la creation d'un profile d'utilisateur soient bien présents et non nuls.

    une fois vérifiées, la fonction crée un objet contenant ces valeur et les envois au serveur à traver le webSocket.
    alors ils sont sauvegardés sous la forme d'un objet dans le localStorage.
    cette objet contient (prénom, nom et url de la photo de profile).
    la sauvegarde dans le localStorage facilite une utilisation ultérieur du profile si l'utilisateur utilise le même appareil.
    si le profile existe deja une erreur est générer coté serveur.
  */
  if(form.firstname.value === undefined || form.lastname.value === undefined || form.profilePic.files.length === 0){
    console.log('missing data')
  }else{
    let newProfile = {
      firstName: form.firstname.value,
      lastName: form.lastname.value,
      profilPic: form.profilePic.files[0],
      imgType: form.profilePic.files[0].type.replace('image/', '')
    }
    mews.emit('create-profile', newProfile)
    setTimeout(function(){
      localStorage.profile = state.hasProfile = "true"
      x.redraw()
    }, 1000)
    localStorage.profileInfo = jss({firstName:newProfile.firstName, lastName: newProfile.lastName, profilPic: './'+newProfile.firstName+'-'+newProfile.lastName+'/avatar.'+newProfile.imgType})
  }
}

const hasNoProfile = {
  /* 
    le composant hasNoProfile est un formulaire qui permet à l'utilisateur de créer son profile
    il se compose de trois éléments le prénom (firstName), le nom de famille (lastName) et d'une photo de profile (profilPic).
    lorsque le formulaire est envoyé, la fonction "checkAndCreateProfile", qui est responsable de la vérification de la présence des données, est appelé apres avoir
    annulé le comportement par défault de l'évènement soumission de formulaire qui rafraichit automatiquement la page.
  */
  view: ()=>{
    return x('div.welcome',null, [
      x('h2',null, 'Welcome'),
      x('p', null, 'Create your profile to continue:'),
      x('form.create-profile', {onsubmit: (e)=>{
        e.preventDefault()
        checkAndCreateProfile(e.target)
      }}, [
        x('label', 'first name:'),
        x('input[type=text]', {class: 'firstname', name: 'firstname'}),
        x('label', 'last name:'),
        x('input[type=text]', {class: 'lastname', name: 'lastname'}),
        x('label', 'select you profile picture:'),
        x('img.profile-thumb',null, null),
        x('input[type=file]', {accept: 'image/*', name: 'profilePic', onchange: (e)=>{
          if(e.target.files.length === 0){
            return
          }else{
            document.querySelector('.profile-thumb').src = window.URL.createObjectURL(e.target.files[0])
            document.querySelector('.profile-thumb').style.display = 'block'
          }
        }}),
        x('input[type=submit]', null, 'Create profile')
      ]),
    ])
  }
}

const hasProfile = {
  /* 
    le composant hasProfile est un conteneur qui à pour seul fonctionctionalité de contenir deux autres composant ("profileHeader" et "profileCollection") qui composent un profile.
  */
  oninit: ()=>{
  },
  view: ()=>{
    return x('div.profile', null, [
      x(profileHeader),
      state.visitCollection !== undefined ? x(visitProfil, {a: (()=>{
        document.querySelector('.collection').style.display = "none";
        })()}): null,
      state.myCollection !== undefined ? x(profileCollection) : null
    ])
  }
}

const profileHeader = {
  /* 
    le composant profileHeader est responsable de mettre en forme les informations utilisateur qui sont son prénom, son nom de famille et sa photo de profile en
    les affichants en haut de la page.
    ce composant contien lui aussi deux composants 
    ("addImageToCollection") qui permet à l'utilisateur d'alimenter sa collection d'images.
    ("profileRequest") donne la possibilité de visiter un autre profile
    ce composant est aussi responsable de récuprer la liste d'url des images de l'utilisateur auprès du serveur.
  */
  oninit: ()=>{
    state.profileData = jsp(localStorage.profileInfo)
    x.request({
      method: 'GET',
      url: '/fetch-profiles',
      withCredentials: true
    }).then(result =>{
      state.existingProfiles = result
    })
    x.request({
      method: 'GET',
      url: '/profile/'+state.profileData.firstName+"-"+state.profileData.lastName,
      withCredentials: true
    }).then(result =>{
      state.myCollection = result
      x.redraw()
    })
  },
  view: ()=>{
    return x('div.profile-header', null, [
      x('p', null, [
        x('span', null, state.profileData.firstName+ ' '),
        x('span', null, state.profileData.lastName),
      ]),
      x('img.profile-thumbnail', {src: state.profileData.profilPic, display: 'block'}),
      x(addImageToCollection),
      state.existingProfiles !== undefined ? x(profileRequest) : null
    ])
  }
}

const addImageToCollection = {
  /* 
    ce composant à pour fonctionnalité l'ajout d'image(s) à la collection personnelle de l'utilisateur.
    il se compose d'un selecteur de fichier qui lors d'un changement 
    envois les fichiers un par un à travers le webSocket.
  */
  view: ()=>{
    return x('input[type=file]', {accept: 'image/*', multiple: true, onchange: (e)=>{
      if(e.target.files.length !== 0){
        let i = e.target.files.length
        for(img of e.target.files){
          mews.emit('add-image', {fullname: state.profileData.firstName+"-"+state.profileData.lastName, name: img.name, buffer: img})
          i--
          if(i === 1){
            window.location.reload()
          }
        }
        x.request({
        method: 'GET',
        url: '/profile/'+state.profileData.firstName+"-"+state.profileData.lastName,
        withCredentials: true
      }).then(result =>{
        state.myCollection = result
      })
      }
    }})
  }
}

const profileRequest = {
  /* 
    Ce composant est composé d'un selecteur d'option. chaque option est reçu depuis le serveur.
    Le bouton valider prend en compte l'option sélectionné et l'utilise pour créer une requete vers le serveur qui repertorie les utilisateurs par leur nom complet, c'est-à-dire un prénom et un nom de famille.
    Le serveur répond avec une liste d'url. Cette liste sera utilité par le composant "visitProfil"
  */
  oninit: ()=>{
  },
  view: ()=>{
    return x('div.profile-request', null, [
      x('form', {onsubmit: (e)=>{
        e.preventDefault();
        x.request({
        method: 'GET',
        url: '/profile/'+e.target.requested[e.target.requested.selectedIndex].value,
        withCredentials: true
      }).then(result =>{
        state.visitCollection = result
      })
      }}, [
        x('label', 'visit another profile: '),
        x('select', {name: 'requested', class:'requested'}, [
          state.existingProfiles.map(profile=>{
            return x('option', {value: profile.firstName+'-'+profile.lastName}, profile.firstName+'-'+profile.lastName)
          })
        ]),
        x('input[type=submit]', {value: "visit"}, 'visit profile')
      ])
    ])
  }
}

const profileCollection = {
  /* 
    ce composant affiche les images récupérées sous forme d'url par le composant "profileHeader" au démarage de l'application et crée une image pour chaque url puis l'ajoute de façon visible à la page.
    après, c'est le composant "addImageToCollection" qui est responsable de récupérer ces url.
  */
  view:()=>{
    return x('div.collection', null, [
      state.myCollection.map(img=>{
        return x('img', {src: img, class:'from-collection'})
      }), 
    ])
  }
}

const visitProfil = {
  /* 
    ce compsosant se comporte exactement comme le composant "profileCollection" à la difference que les url sont récupérée par le compososant profileRequest après validation.
  */
  oninit:()=>{

  },
  view: ()=>{
    return x('div.visit', [
      state.visitCollection !== undefined ? state.visitCollection.map(url=>{
        return x('img', {src: url, class:'from-collection'})
      }) : null
    ])
  }
}

let theHomepage = {
  /* 
    ce composant est responsable de la mise-en-page générale. si l'utilisateur n'as pas de profile il affichera le composant "hasNoProfile".
    si l'utilisateur à un profile, il affichera le compsant "hasProfile".
  */
  oninit: ()=>{
    state.hasProfile = localStorage.profile
  },
  view: ()=>{
    return x('div', [
      state.hasProfile === "true" ? x(hasProfile) : null,
      state.hasProfile === "false" ? x(hasNoProfile) : null,
    ])
  }
}
x.mount(document.body, theHomepage)
