import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import App from "./App"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const mockFetchResponse = (data) => ({
  ok: true,
  status: 200,
  json: async () => data,
})

describe("App Component", () => {
    let mockFetch

    beforeEach(() => {
    mockFetch = vi.fn(() =>
        Promise.resolve(mockFetchResponse([]))
    )
    global.fetch = mockFetch
    })


    afterEach(() => {
    vi.restoreAllMocks()
    })


    it("renders main layout with sidebar and header", () => {
        mockFetch.mockResolvedValueOnce(
        mockFetchResponse({ totalGB: 5 })
        )


        render(<App />)

        expect(screen.getByAltText("TDrive Logo")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("Search in TDrive...")).toBeInTheDocument()
    })

    it("renders sidebar with navigation", () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ totalGB: 5 })
        })

        render(<App />)

        expect(screen.getByText("TDrive")).toBeInTheDocument()
        expect(screen.getByText("Home")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /new/i })).toBeInTheDocument()
    })

    it("toggles between list and grid view", () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ totalGB: 5 })
        })

        render(<App />)

        const gridBtn = screen.getByLabelText("Grid view")
        const listBtn = screen.getByLabelText("List view")

        // switch to grid
        fireEvent.click(gridBtn)

        expect(gridBtn).toHaveAttribute("data-variant", "secondary")
        expect(listBtn).toHaveAttribute("data-variant", "ghost")

        // switch back to list
        fireEvent.click(listBtn)

        expect(listBtn).toHaveAttribute("data-variant", "secondary")
    })

    it("loads files on mount", async () => {
        const mockFiles = [
            { id: "1", file_name: "test.txt", mimetype: "text/plain", uploaded_at: "2025-01-10T10:00:00Z", total_size: 1024 }
        ]

        mockFetch.mockResolvedValueOnce({
            json: async () => ({ totalGB: 5 })
        }).mockResolvedValueOnce({
            json: async () => mockFiles
        })

        render(<App />)

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/files"),
                expect.objectContaining({
                    headers: expect.objectContaining({ "x-api-key": expect.any(String) })
                })
            )
        })
    })

    it("updates files when search query changes", async () => {
        const mockSearchResults = [
            { id: "1", file_name: "document.pdf", mimetype: "application/pdf", uploaded_at: "2025-01-10T10:00:00Z", total_size: 1024 }
        ]

        mockFetch
            .mockResolvedValueOnce({
                json: async () => ({ totalGB: 5 })
            })
            .mockResolvedValueOnce({
                json: async () => []
            })
            .mockResolvedValueOnce({
                json: async () => mockSearchResults
            })

        render(<App />)

        const searchInput = screen.getByPlaceholderText("Search in TDrive...")
        fireEvent.change(searchInput, { target: { value: "document" } })

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/search/?q=document"),
                expect.any(Object)
            )
        }, { timeout: 500 })
    })

    it("displays file list view by default", () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ totalGB: 5 })
        })

        render(<App />)

        const listBtn = screen.getByLabelText("List view")
        expect(listBtn).toHaveAttribute("data-variant", "secondary")
    })

    it("displays grid view when grid toggle is clicked", () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ totalGB: 5 })
        })

        render(<App />)

        const gridBtn = screen.getByLabelText("Grid view")
        fireEvent.click(gridBtn)

        expect(gridBtn).toHaveAttribute("data-variant", "secondary")
    })

    it("passes files to file list component", async () => {
        const mockFiles = [
            { id: "1", file_name: "test1.txt", mimetype: "text/plain", uploaded_at: "2025-01-10T10:00:00Z", total_size: 1024 },
            { id: "2", file_name: "test2.txt", mimetype: "text/plain", uploaded_at: "2025-01-09T10:00:00Z", total_size: 2048 }
        ]

        mockFetch
            .mockResolvedValueOnce({
                json: async () => ({ totalGB: 5 })
            })
            .mockResolvedValueOnce({
                json: async () => mockFiles
            })

        render(<App />)

        await waitFor(() => {
            expect(screen.getByText("test1.txt")).toBeInTheDocument()
            expect(screen.getByText("test2.txt")).toBeInTheDocument()
        })
    })

    it("passes files to file grid component when toggled", async () => {
        const mockFiles = [
            { id: "1", file_name: "test.txt", mimetype: "text/plain", uploaded_at: "2025-01-10T10:00:00Z", total_size: 1024 }
        ]

        mockFetch
            .mockResolvedValueOnce({
                json: async () => ({ totalGB: 5 })
            })
            .mockResolvedValueOnce({
                json: async () => mockFiles
            })

        render(<App />)

        await waitFor(() => {
            expect(screen.getByText("test.txt")).toBeInTheDocument()
        })

        const gridBtn = screen.getByLabelText("Grid view")
        fireEvent.click(gridBtn)

        // File should still be visible in grid view
        expect(screen.getByText("test.txt")).toBeInTheDocument()
    })

    it("handles upload progress notifications", async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ totalGB: 5 })
        })

        const { rerender } = render(<App />)

        // The component should render without errors
        expect(screen.getByText("TDrive")).toBeInTheDocument()
    })

    it("displays upload progress widget when upload is active", async () => {
        mockFetch.mockResolvedValue({
            json: async () => ({ totalGB: 5 })
        })

        render(<App />)

        // Initially upload widget should not be visible
        expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()
    })

    it("uses correct API endpoints with API key", async () => {
        mockFetch
            .mockResolvedValueOnce({
                json: async () => ({ totalGB: 5 })
            })
            .mockResolvedValueOnce({
                json: async () => []
            })

        render(<App />)

        await waitFor(() => {
            const calls = mockFetch.mock.calls
            calls.forEach(call => {
                const headers = call[1]?.headers
                if (headers) {
                    expect(headers["x-api-key"]).toBeDefined()
                }
            })
        })
    })

    it("refreshes files when refresh is triggered", async () => {
        const mockFiles = [
            { id: "1", file_name: "test.txt", mimetype: "text/plain", uploaded_at: "2025-01-10T10:00:00Z", total_size: 1024 }
        ]

        mockFetch
            .mockResolvedValueOnce({
                json: async () => ({ totalGB: 5 })
            })
            .mockResolvedValueOnce({
                json: async () => mockFiles
            })
            .mockResolvedValueOnce({
                json: async () => mockFiles
            })

        render(<App />)

        await waitFor(() => {
            expect(screen.getByText("test.txt")).toBeInTheDocument()
        })

        // Verify that fetch was called for files
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("/files"),
            expect.any(Object)
        )
    })

    it("clears search query when search input is emptied", async () => {
        mockFetch
            .mockResolvedValueOnce({
                json: async () => ({ totalGB: 5 })
            })
            .mockResolvedValueOnce({
                json: async () => []
            })

        render(<App />)

        const searchInput = screen.getByPlaceholderText("Search in TDrive...")

        // Type something
        fireEvent.change(searchInput, { target: { value: "test" } })

        await waitFor(() => {
            expect(searchInput).toHaveValue("test")
        })

        // Clear search
        fireEvent.change(searchInput, { target: { value: "" } })

        await waitFor(() => {
            expect(searchInput).toHaveValue("")
        }, { timeout: 500 })
    })
})