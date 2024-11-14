import React, {useEffect, useState} from 'react';
import {Button, View, Text} from 'react-native';
import * as Google from 'expo-auth-session';
import {firebase} from '../firebaseConfig';

export default function LoginScreen () {
  const [user, setUser] = useState (null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest ({
    clientId: '291502422337-sc1g6sc01h20olglrtkcq6kuosdo0auo.apps.googleusercontent.com',
  });

  useEffect (
    () => {
      if (response && response.type === 'success') {
        const {id_token} = response.params;
        const credential = firebase.auth.GoogleAuthProvider.credential (
          id_token
        );
        firebase
          .auth ()
          .signInWithCredential (credential)
          .then (userCredential => {
            setUser (userCredential.user);
          })
          .catch (error => {
            console.error (error.message);
          });
      }
    },
    [response]
  );

  return (
    <View>
      <Button
        disabled={!request}
        title="Login with Google"
        onPress={() => promptAsync ()}
      />
      {user && <Text>Welcome, {user.displayName}</Text>}
    </View>
  );
}
