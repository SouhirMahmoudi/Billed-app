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
import router from "../app/Router.js";

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
      const image1 = new File([""], "image1.jpg");
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
      const texte = new File([""], "text.txt");
      userEvent.upload(file, texte)
      expect(handleChangeFile).toHaveBeenCalled()
      expect(validFile).toBeFalsy()
    })

    test('then when I choose a file with a good extension, function handleChangeFile should return true', () => {
      //it("should not display an alert 'Invalid format (!only image format is accepted)'")
      window.onNavigate(ROUTES_PATH['NewBill'])
      const html = NewBillUI({})
      document.body.innerHTML = html
      const newbill = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
      const handleChangeFile = jest.fn((e) => newbill.handleChangeFile(e))
      const file = screen.getByTestId("file")
      file.addEventListener("change", (e) => { handleChangeFile(e) })
      const image2 = new File([""], "image2.jpg");
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
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "accepted",
        "type": "Hôtel et logement",
        "commentAdmin": "ok",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "email": "a@a",
        "pct": 20
      }
      const html = NewBillUI(Bill)
      document.body.innerHTML = html
      const handleSubmit = jest.fn((e) => newbill.handleSubmit(e))
      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", (e) => { handleSubmit(e) })
      fireEvent.submit(form)

      expect(screen.getByTestId("expense-name")).toBeTruthy()
      expect(screen.getByTestId("datepicker")).toBeTruthy()
      expect(screen.getByTestId("amount")).toBeTruthy()
      expect(screen.getByTestId("vat")).toBeTruthy()
      expect(screen.getByTestId("pct")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
      expect(handleSubmit).toHaveBeenCalled()
      
    })

  })
})



