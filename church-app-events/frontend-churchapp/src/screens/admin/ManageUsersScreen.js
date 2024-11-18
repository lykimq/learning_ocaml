import React, {useEffect, useState} from 'react';
import {View, Button, FlatList} from 'react-native';
import {getUsers, deleteUser} from '../../services/userService';
import {Text} from 'react-native';

// Allow admin to manage users (view, delete)
const ManageUsersScreen = () => {
  const [users, setUsers] = useState ([]);

  useEffect (() => {
    fetchUsers ();
  }, []);

  const fetchUsers = async () => {
    const data = await getUsers ();
    setUsers (data);
  };

  const handleDelete = userId => {
    deleteUser (userId);
    fetchUsers ();
  };

  return (
    <View>
      <Text>Manage Users</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id.toString ()}
        renderItem={({item}) => (
          <View style={{margin: 10, padding: 10, borderWidth: 1}}>
            <Text>{item.name}</Text>
            <Button title="Delete" onPress={() => handleDelete (item.id)} />
          </View>
        )}
      />
    </View>
  );
};

export default ManageUsersScreen;
