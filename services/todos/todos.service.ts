import { getData, postData, patchData, putData, deleteData } from "@/services/api/client";
import type {
  Todo,
  CreateTodoInput,
  UpdateTodoInput,
  EmployeeTodoGroup,
} from "@/types";

export const todosService = {
  listMine(): Promise<Todo[]> {
    return getData<Todo[]>("/todos");
  },

  create(input: CreateTodoInput): Promise<Todo> {
    return postData<Todo>("/todos", input);
  },

  update(id: string, input: UpdateTodoInput): Promise<Todo> {
    return patchData<Todo>(`/todos/${id}`, input);
  },

  remove(id: string): Promise<{ success: boolean }> {
    return deleteData<{ success: boolean }>(`/todos/${id}`);
  },

  reorder(orderedIds: string[]): Promise<Todo[]> {
    return putData<Todo[]>("/todos/reorder", { orderedIds });
  },

  listEmployees(): Promise<EmployeeTodoGroup[]> {
    return getData<EmployeeTodoGroup[]>("/todos/employees");
  },
};
