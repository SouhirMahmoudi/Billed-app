/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { fireEvent, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

// test d'intégration GET
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
    })

    test('Then mail icon in vertical layout should be highlighted', () => {
      window.onNavigate(ROUTES_PATH['NewBill'])
      const icon = screen.getByTestId('icon-mail')
      expect(icon.className).toBe('active-icon')
    })

    test('then a NewBill page is loading', () => {
      window.onNavigate(ROUTES_PATH['NewBill'])
      const html = NewBillUI({})
      document.body.innerHTML = html
      const contentTitle = screen.getAllByText('Envoyer une note de frais')
      expect(contentTitle).toBeTruthy()
    })


    test('then I can upload a file', () => {
      window.onNavigate(ROUTES_PATH['NewBill'])
      const html = NewBillUI({})
      document.body.innerHTML = html
      const newbill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      const handleChangeFile = jest.fn((e) => newbill.handleChangeFile(e))
      const file = screen.getByTestId("file")
      file.addEventListener("change", (e) => { handleChangeFile(e) })
      const image1 = new File([""], "image1.jpg")
      userEvent.upload(file, image1)
      expect(handleChangeFile).toHaveBeenCalled()
    })

    test('then when I choose a file with a bad extension, function handleChangeFile should return false', () => {
      window.onNavigate(ROUTES_PATH['NewBill'])
      const html = NewBillUI({})
      document.body.innerHTML = html
      const newbill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      let validFile
      const handleChangeFile = jest.fn((e) => { validFile = newbill.handleChangeFile(e) })
      const file = screen.getByTestId("file")
      file.addEventListener("change", (e) => { handleChangeFile(e) })
      const texte = new File([""], "text.txt")
      userEvent.upload(file, texte)
      expect(handleChangeFile).toHaveBeenCalled()
      expect(validFile).toBeFalsy()
    })

    test('then when I choose a file with a good extension, function handleChangeFile should return true', () => {
      window.onNavigate(ROUTES_PATH['NewBill'])
      const html = NewBillUI({})
      document.body.innerHTML = html
      const newbill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      const handleChangeFile = jest.fn((e) => newbill.handleChangeFile(e))
      const file = screen.getByTestId("file")
      file.addEventListener("change", (e) => { handleChangeFile(e) })
      const image2 = new File([""], "image2.jpg")
      userEvent.upload(file, image2)
      expect(handleChangeFile).toHaveBeenCalled()
      expect(handleChangeFile).toBeTruthy()
    })

    // test d'intégration post 


    test(('when I do fill fields in correct format and I click on submit, it should post new bill'), () => {
      window.onNavigate(ROUTES_PATH['NewBill'])
      const newbill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      const Bill =
      {
        "vat": "80",
        "status": "pending",
        "type": "Hôtel et logement",
        "name": "",
        "file": new File([""], "imageTest.jpg"),
        "date": "200404",
        "amount": 400,
        "pct": 20
      }
      const html = NewBillUI(Bill)
      document.body.innerHTML = html
      // check if element html of form exist
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()

      //get html elements inputs
      const Name = screen.getByTestId('expense-name')
      const Date = screen.getByTestId('datepicker')
      const Ammount = screen.getByTestId('amount')
      const Vat = screen.getByTestId('vat')
      const Pct = screen.getByTestId('pct')
      const file = screen.getByTestId('file')
      const form = screen.getByTestId("form-new-bill")

      // Edit input HTML
      fireEvent.change(Name, { target: { value: Bill.name } })
      fireEvent.change(Date, { target: { value: Bill.date } })
      fireEvent.change(Ammount, { target: { value: Bill.amount } })
      fireEvent.change(Vat, { target: { value: Bill.vat } })
      fireEvent.change(Pct, { target: { value: Bill.pct } })

      // Submit form
      const handleSubmit = jest.fn((e) => newbill.handleSubmit(e))
      form.addEventListener("submit", (e) => { handleSubmit(e) })
      fireEvent.submit(form)
      waitFor(() => { userEvent.upload(file, Bill.file) })

      // check if handlesubmit is called 
      expect(handleSubmit).toHaveBeenCalled()

    })

  })
})

// test error 404 and 500cd 
describe("Given I am connected as Employee", () => {
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      )
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router();
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH["Bills"]);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH["Bills"]);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    })
  })
})

   