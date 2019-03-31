const jss = JSON.stringify
const jsp = JSON.parse
const x = m
const mews = io('ws://localhost:2019/katasocket')
if(localStorage.profile === undefined){
  localStorage.profile = false
}
const state = {
  hasProfile: localStorage.profile,
}
/* profileData = {
    firstName: "name",
    lastName: "lastname",
    profilPic: "buffer",
    imgType: ""
  } */
  /* picData = {
    fullname: "full-name",
    name: "name",
    buffer: "buffer"
  } */

const checkAndCreateProfile = (form)=>{
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
  view:()=>{
    return x('div.collection', null, [
      state.myCollection.map(img=>{
        return x('img', {src: img, class:'from-collection'})
      }), 
    ])
  }
}

const visitProfil = {
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
