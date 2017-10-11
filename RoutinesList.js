import React from 'react'
import { connect } from 'react-redux'
import { List, Text, Container, Content, Header, Footer, connectStyle, View } from 'native-base'
import Icon from 'react-native-vector-icons/Ionicons'
import ApplicationStyles from '../Themes/ApplicationStyles'
import RoutineListItem from '../Components/RoutineListItem'
import { filter } from 'ramda'
import { Colors, Images } from '../Themes'
import CustomNavBar from '../Components/CustomNavBar'
import FooterNavBar from '../Components/FooterNavBar'
import { firebaseConnect } from 'react-redux-firebase'

/**
 * TODO: Enforce authentication. Data retreival only successful if logged in
 */
class RoutinesList extends React.Component {
  componentDidMount () {
    console.log('mounted')
  }
  _filterPrimary = (item) => {
    if (item.isPrimary) {
      return item
    }
  }

  _filterDefault = (item) => {
    if (!item.isPrimary) {
      return item
    }
  }

  render () {
    const styles = this.props.style
    let primaryData = filter(this._filterPrimary, this.props.routines)
    let defaultData = filter(this._filterDefault, this.props.routines)
    return (
      <Container style={styles.routinesContainer}>
        <Header>
          <CustomNavBar title='My Routines' />
        </Header>
        <Content>
          <View style={styles.routinesPrimaryRoutineView}>
            <Text style={styles.routinesPrimaryRoutineLabel} uppercase >PRIMARY ROUTINES</Text>
            <Icon name='ios-alert-outline' size={17} style={styles.routinesPrimaryRoutineIcon} color={Colors.text} />
          </View>
          <List
            dataArray={primaryData}
            renderRow={this.renderRow}
          />
          <View style={styles.routinesPrimaryRoutineView}>
            <Text style={styles.routinesPrimaryRoutineLabel} uppercase >OTHER ROUTINES</Text>
          </View>
          <List
            dataArray={defaultData}
            renderRow={this.renderRow}
          />
        </Content>
        <Footer>
          <FooterNavBar />
        </Footer>
      </Container>
    )
  }

  renderRow (routine) {
    let thumbnailSource
    // local image needs require(.../hi.jpg)
    if (routine.image && routine.image.file && routine.image.file.url) {
      thumbnailSource = { uri: 'https:' + routine.image.file.url, cache: 'force-cache' }
    } else {
      thumbnailSource = Images.launch
    }
    return (
      <RoutineListItem routine={routine} thumbnailSource={thumbnailSource} />
    )
  }
}

RoutinesList.contextTypes = { drawer: React.PropTypes.object }
const mapStateToProps = ({firebase: { data: { userRoutines }, auth, errors }}) => {
  return {
    routines: userRoutines ? userRoutines[auth.uid] : [],
    errors: errors
  }
}

const fbWrappedComponent = firebaseConnect((props, firebase) => (
  [
  { type: 'once', path: `userRoutines/${firebase._.authUid}` }
  ]
))(RoutinesList)

export default connect(mapStateToProps)(connectStyle('Pandavist.RoutinesList', ApplicationStyles)(fbWrappedComponent))
