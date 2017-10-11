import React, { PropTypes } from 'react'
import { Keyboard, LayoutAnimation } from 'react-native'
import { connect } from 'react-redux'
import ApplicationStyles from '../Themes/ApplicationStyles'
import { Metrics } from '../Themes'
import LoginActions from '../Redux/LoginRedux'
import EmailLogin from '../Components/EmailLogin'
import { Actions as NavigationActions } from 'react-native-router-flux'
import { Button, Text, View, connectStyle, Header, Toast } from 'native-base'
import CustomNavBar from '../Components/CustomNavBar'
import firebase from '../Services/Firebase'
import { LoginManager, AccessToken } from 'react-native-fbsdk'

class SignupScreen extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func,
    fetching: PropTypes.bool,
    attemptLogin: PropTypes.func
  }

  isAttempting = false
  keyboardDidShowListener = {}
  keyboardDidHideListener = {}

  constructor (props) {
    super(props)
    this.state = {
      visibleHeight: Metrics.screenHeight
    }
    this.isAttempting = false
  }

  componentWillReceiveProps (newProps) {
    this.forceUpdate()
    // Did the login attempt complete?
    if (this.isAttempting && !newProps.fetching) {
      NavigationActions.pop()
    }
  }

  componentWillMount () {
    // Using keyboardWillShow/Hide looks 1,000 times better, but doesn't work on Android
    // TODO: Revisit this if Android begins to support - https://github.com/facebook/react-native/issues/3468
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow)
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide)
  }

  componentWillUnmount () {
    this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener.remove()
  }

  keyboardDidShow = e => {
    // Animation types easeInEaseOut/linear/spring
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    let newSize = Metrics.screenHeight - e.endCoordinates.height
    this.setState({
      visibleHeight: newSize
    })
  }

  keyboardDidHide = e => {
    // Animation types easeInEaseOut/linear/spring
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    this.setState({
      visibleHeight: Metrics.screenHeight
    })
  }

  handlePressFacebookSignup = () => {
    LoginManager
      .logInWithReadPermissions(['public_profile', 'email'])
      .then((result) => {
        if (result.isCancelled) {
          return Promise.resolve('cancelled')
            .then((resultData) => {
              Toast.show({
                text: resultData,
                position: 'bottom',
                buttonText: 'OK'
              })
            })
        }
        console.log(`Login success with permissions: ${result.grantedPermissions.toString()}`)
        // get the access token
        return AccessToken.getCurrentAccessToken()
      })
      .then(data => {
        // create a new firebase credential with the token
        const credential = firebase.auth.FacebookAuthProvider.credential(data.accessToken)

        // login with credential
        return firebase.auth().signInWithCredential(credential)
      })
      .then((currentUser) => {
        if (currentUser === 'cancelled') {
          console.log('Login cancelled')
        } else {
          // now signed in
          console.warn(JSON.stringify(currentUser.toJSON()))
          NavigationActions.pop()
        }
      })
      .catch((error) => {
        console.log(`Login fail with error: ${error}`)
      })
  }

  handlePressSignup = () => {
    const { username, password } = this.state
    this.isAttempting = true
    if (username !== undefined && password !== undefined) {
      firebase.auth().createUserWithEmailAndPassword(username, password)
        .then((user) => {
          console.log('user created', user)
          Toast.show({
            text: 'Thanks for signing up!',
            position: 'top',
            duration: 1000
          })

          // First Time User, set up account
          // TODO: Move this to a method, promise, etc

          firebase.database()
            .ref('users').child(user.uid)
            .set({
              'email': user.email,
              'answers': this.props.answers
            })

          // copy initial routines into user space
          //  right now copying all routines. In the future, CMS to manage which routines
          //  to use. Copy based on intial signup questions
          firebase.database().ref('content/routines').once('value', (snapshot) => {
            firebase.database().ref('userRoutines').child(user.uid).set(snapshot.val())
          })

          NavigationActions.signup2()
        })
        .catch((err) => {
          console.log('An error occurred', err)
          Toast.show({
            text: err.toString(),
            position: 'bottom',
            buttonText: 'OK'
          })

          console.log('An error occurred', err)
        })
    } else {
      Toast.show({
        text: 'Fill Email or password',
        position: 'bottom',
        buttonText: 'OK'
      })
    }
  }

  handleInputUpdate = inputs => {
    this.setState({
      username: inputs.username,
      password: inputs.password
    })
  }

  render () {
    const styles = this.props.style
    return (
      <View
        contentContainerStyle={{ justifyContent: 'center' }}
        style={styles.loginContainer}
        keyboardShouldPersistTaps='always'
      >
        <Header>
          <CustomNavBar title='Sign Up' />
        </Header>
        <View style={styles.loginForm}>
          <EmailLogin yellow handlePressLogin={this.handlePressSignup} handleUpdate={this.handleInputUpdate.bind(this)} />
          <View style={styles.loginColumn}>
            <Button full rounded primary shadow onPress={this.handlePressSignup}>
              <Text>Sign Up</Text>
            </Button>
            <Text style={styles.loginOrLabel}>
              OR
            </Text>
            <Button full rounded facebook shadow style={styles.loginFacebookButton} onPress={this.handlePressFacebookSignup}>
              <Text>Sign Up with Facebook</Text>
            </Button>
            <Text style={styles.loginNoAccountLabel}>Already have an account?</Text>
            <Button transparent info style={styles.loginSignUpButton} onPress={NavigationActions.login}>
              <Text style={styles.loginSignUpLabel}>Login</Text>
            </Button>
          </View>
        </View>
      </View>
    )
  }
}

SignupScreen.contextTypes = { drawer: React.PropTypes.object }
const mapStateToProps = state => {
  return {
    // ...redux state to props here
  }
}

const mapDispatchToProps = dispatch => {
  return {
    attemptLogin: (username, password) => dispatch(LoginActions.loginRequest(username, password))
  }
}

export default connectStyle('Pandavist.SignupScreen', ApplicationStyles)(connect(mapStateToProps, mapDispatchToProps)(SignupScreen)) // before wrapping in Firebase
