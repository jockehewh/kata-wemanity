const jss = JSON.stringify
const jsp = JSON.parse
const x = m
const mews = io('ws://localhost:2019/katasocket')
const state = {
  hasProfile: false,
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
  console.log(form.firstname.value, form.lastname.value, form.profilePic.files)
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
    localStorage.profile = state.hasProfile = "true"
  }
}

const hasNoProfile = {
  view: ()=>{
    return x('div.welcome',null, [
      x('h2',null, 'Welcome'),
      x('p', null, 'Create your profile to continue:'),
      x('form.create-profile', {onsubmit: (e)=>{
        e.preventDefault()
        console.log(e.target.firstname)
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

const hasProfile = {}

const profileHeader = {}

const profileRequest = {}

const profileCollection = {}

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