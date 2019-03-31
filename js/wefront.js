const jss = JSON.stringify
const jsp = JSON.parse
const x = m
const mews = io('ws://localhost:2019/katasocket')
const state = {
  one: false,
  two: false
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
let newProfile = {
  name: 'Xavierox',
  lastname: "Bélénus",
  picture: 'somedata'
}
mews.emit('create-profile', jss(newProfile))

let theHomepage = {
  oninit: ()=>{
    state.one = true
  },
  view: (vnode)=>{
    return x('div', [
      state.one ? x('p', "Paragraphe un") : null,
      state.two ? x('p', "Paragraphe deux") : null,
      x('button', {onclick: (e)=>{
        state.one = !state.one
        state.two = !state.two
       }
      } , "toggle"),
      x('input[type=file]',{accept: 'image/*', multiple: true, onchange:(e)=>{
        console.log(e.target.files)
        for(file of e.target.files){
          console.log(file)
        }
      }})
    ])
  }
}
x.mount(document.body, x(theHomepage, {state}))