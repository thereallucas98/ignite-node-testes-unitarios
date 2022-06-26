import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Create a statement", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );
  });

  it("should be able to create a deposit", async () => {
    const user: ICreateUserDTO = {
      name: "David Lucas",
      email: "lucas@test.com",
      password: "password",
    };

    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    const statement = await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 250,
      description: "Depositing $250",
    });

    expect(statement).toHaveProperty("id");
    expect(statement.amount).toEqual(250);
  });

  it("should be able to create a withdraw", async () => {
    const user: ICreateUserDTO = {
      name: "David Lucas",
      email: "lucas@test.com",
      password: "password",
    };

    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Depositing $100",
    });

    const withdraw = await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.WITHDRAW,
      amount: 20,
      description: "Withdrawing $20",
    });

    expect(withdraw).toHaveProperty("id");
  });

  it("should not be able to create a statement (deposit/withdraw) for an inexistent user", async () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: "null_user",
        type: OperationType.DEPOSIT,
        amount: 1000,
        description: "Depositing $1000",
      });
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it("should not be able to create a withdraw when user has insufficient funds", async () => {
    const user = await createUserUseCase.execute({
      name: "David Lucas",
      email: "lucas@gmail.com",
      password: "123456",
    });

    await createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.DEPOSIT,
      amount: 500,
      description: "Depositing $500",
    });

    await expect(
      createStatementUseCase.execute({
        user_id: user.id as string,
        type: OperationType.WITHDRAW,
        amount: 600,
        description: "withdraw $600",
      })
    ).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });

  // it("should be able to create a transfer", async () => {
  //   const user01 = await createUserUseCase.execute({
  //     name: "David Lucas",
  //     email: "lucas@gmail.com",
  //     password: "123456",
  //   });

  //   const user02 = await createUserUseCase.execute({
  //     name: "David",
  //     email: "david@gmail.com",
  //     password: "123456",
  //   });

  //   await createStatementUseCase.execute({
  //     user_id: user01.id as string,
  //     type: OperationType.DEPOSIT,
  //     amount: 50,
  //     description: "Depositing $50",
  //   });

  //   const statement = await createStatementUseCase.execute({
  //     user_id: user02.id as string,
  //     sender_id: user01.id as string,
  //     type: OperationType.TRANSFER,
  //     amount: 25,
  //     description: "Transfer $25 to User 02",
  //   });
  // });
});
