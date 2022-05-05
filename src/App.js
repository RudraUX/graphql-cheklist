import React from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_TODOS = gql`
  query getTodos {
    todos {
      done
      id
      text
    }
  }
`;

const TOGGLE_TODO = gql`
  mutation toggletodo($id: uuid!, $done: Boolean) {
    update_todos(where: { id: { _eq: $id } }, _set: { done: $done }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

const ADD_TODO = gql`
  mutation addtodo($text: String!) {
    insert_todos(objects: { text: $text }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

const DELETE_TODO = gql`
  mutation delete_todo($id: uuid!) {
    delete_todos(where: { id: { _eq: $id } }) {
      returning {
        id
        text
      }
    }
  }
`;

function App() {
  const [todoText, setTodoText] = React.useState('');
  const { data, loading, error } = useQuery(GET_TODOS);
  const [toogleTodo] = useMutation(TOGGLE_TODO);
  const [addtodo] = useMutation(ADD_TODO, {
    onCompleted: () => setTodoText(''),
  });
  const [delete_todo] = useMutation(DELETE_TODO);

  const handleToggleTodo = async ({ id, done }) => {
    const data = await toogleTodo({ variables: { id, done: !done } });
    console.log('toggle todo', data);
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!todoText.trim()) return;
    const data = await addtodo({
      variables: { text: todoText },
      refetchQueries: [{ query: GET_TODOS }],
    });
    console.log('add todo', data);
    // setTodoText('');
  };

  const handleDeleteTodo = async ({ id }) => {
    const isConfirmed = window.confirm('Do you want to delete this todo? ');

    if (isConfirmed) {
      const data = await delete_todo({
        variables: {
          id,
        },
        update: (cache) => {
          const pervData = cache.readQuery({ query: GET_TODOS });
          const newTodos = pervData.todos.filter((todo) => todo.id !== id);
          cache.writeQuery({ query: GET_TODOS, data: { todos: newTodos } });
        },
      });
      console.log('delete todo', data);
    }
  };

  if (loading) return <div>Loading todos...</div>;
  if (error) return <div> Error fetching</div>;
  return (
    <div className="vh-100 code flex flex-column items-center bg-purple white pa3 fl-1">
      <h1 className="f2-l">
        Graphql Cheklist{' '}
        <span role="img" aria-label="Checkmark">
          ✅
        </span>
      </h1>
      {/* Todo Form */}
      <form onSubmit={handleAddTodo} className="mb3">
        <input
          className="pa2 f4 b--dashed"
          type="text"
          placeholder="Write your todo"
          onChange={(e) => setTodoText(e.target.value)}
          value={todoText}
        />
        <button className="pa2 f4 bg-green" type="submit">
          Create
        </button>
      </form>
      {/* Todo List */}
      <div className="flex items-center justify-content flex-column">
        {data.todos.map((todo) => (
          <p onDoubleClick={() => handleToggleTodo(todo)} key={todo.id}>
            <span className={`pointer list pa1 f3 ${todo.done && 'strike'}`}>
              {todo.text}
            </span>{' '}
            <button
              onClick={() => handleDeleteTodo(todo)}
              className="bg-transparent bn f4"
            >
              <span className="red">&times;</span>
            </button>
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
