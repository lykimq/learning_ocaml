import React, {useState} from 'react';
import {View, TextInput, Button} from 'react-native';

// Form for creating or editing a home group

const HomeGroupForm = ({onSubmit, initialValues}) => {
  const [name, setName] = useState (initialValues ? initialValues.name : '');
  const [description, setDescription] = useState (
    initialValues ? initialValues.description : ''
  );

  const handleSubmit = () => {
    onSubmit ({name, description});
  };

  return (
    <View>
      <TextInput
        placeholder="Group Name"
        value={name}
        onChangeText={setName}
        style={{borderWidth: 1, marginBottom: 10}}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={{borderWidth: 1, marginBottom: 10}}
      />
      <Button title="Save" onPress={handleSubmit} />
    </View>
  );
};

export default HomeGroupForm;
