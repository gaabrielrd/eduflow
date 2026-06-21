declare module "@testing-library/react" {
  export const render: (...args: any[]) => any;
  export const screen: any;
  export const waitFor: (...args: any[]) => Promise<any>;
}

declare module "@testing-library/user-event" {
  const userEvent: {
    setup: () => any;
  };

  export default userEvent;
}
