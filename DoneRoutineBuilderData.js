import React from 'react'
import { connect } from 'react-redux'
import RoutineCreated from './RoutineCreated'
import firebase from '../Services/Firebase'
import RoutineActions from '../Redux/RoutinesRedux'
import ElementConfig from 'ElementConfig'
import { firebaseConnect } from 'react-redux-firebase'
let routineInfoData={}
class DoneRoutineBuilderData extends React.Component {
  componentWillMount () {
    const { routinename, descriptionText, motivationText, selected1, avatarSource } = ElementConfig.addRoutine
    let elements = ElementConfig.routineBuilder.map((value, key) => {
      return ({
        'assets': {
          0: {
            'description': value.description
          }
        },
        'backgroundImage': '',
        'category': value.category,
        'duration': value.lenght,
        'id': eleId,
        'title': value.elementname
      })
    })
    let updates = {}
    let id = firebase.database().ref('userRoutines').child(firebase._.authUid).push().key
    let eleId = firebase.database().ref('userRoutines' + firebase._.authUid + '/').child('elements/').push().key
     routineInfoData = {
      'dayTime': selected1,
      'description': descriptionText,
      'elements': elements,
      'goal': motivationText,
      'id': id,
      'image': avatarSource,
      'isPrimary': false,
      'name': routinename
    }
    updates[firebase._.authUid + '/' + id] = routineInfoData
    this.props.storeRoutineData(routineInfoData)
    return firebase.database().ref('userRoutines').update(updates)
      .then((result) => {
        console.warn('result', result)
      })
  }
  render () {
    return (
      <RoutineCreated routineInfoData={routineInfoData}/>
    )
  }
}

const fbWrappedComponent = firebaseConnect((props, firebase) => (
  [
    { type: 'once', path: `userRoutines/${firebase._.authUid}` }
  ]
))(DoneRoutineBuilderData)

const mapStateToProps = state => {
  return {
    firebase: state.firebase,
    errors: state.firebase.errors
  }
}
const mapDispatchToProps = dispatch => {
  return {
    storeRoutineData: (routineInfoData) => dispatch(RoutineActions.routineRequest(routineInfoData))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(fbWrappedComponent)
