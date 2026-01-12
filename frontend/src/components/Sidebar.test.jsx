import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Sidebar } from "./Sidebar"

describe("Sidebar Component", () => {
    let mockFetch
    let mockEventSource

    beforeEach(() => {
        mockFetch = vi.fn()
        global.fetch = mockFetch
        mockEventSource = vi.fn()
        global.EventSource = mockEventSource
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("renders sidebar with logo and navigation items", () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ totalGB: 5 })
        })

        render(
            <Sidebar
                onUploadStart={vi.fn()}
                onUploadProgress={vi.fn()}
                onUploadSuccess={vi.fn()}
                onUploadComplete={vi.fn()}
            />
        )

        expect(screen.getByAltText("TDrive Logo")).toBeInTheDocument()
        expect(screen.getByText("TDrive")).toBeInTheDocument()
        expect(screen.getByText("Home")).toBeInTheDocument()
        expect(screen.getByText("My Drive")).toBeInTheDocument()
        expect(screen.getByText("Recent")).toBeInTheDocument()
        expect(screen.getByText("Starred")).toBeInTheDocument()
        expect(screen.getByText("Trash")).toBeInTheDocument()
    })

    it("renders new file button", () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ totalGB: 5 })
        })

        render(
            <Sidebar
                onUploadStart={vi.fn()}
                onUploadProgress={vi.fn()}
                onUploadSuccess={vi.fn()}
                onUploadComplete={vi.fn()}
            />
        )

        expect(screen.getByRole("button", { name: /new/i })).toBeInTheDocument()
    })

    it("displays total storage when stats are loaded", async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ totalGB: 15.5 })
        })

        render(
            <Sidebar
                onUploadStart={vi.fn()}
                onUploadProgress={vi.fn()}
                onUploadSuccess={vi.fn()}
                onUploadComplete={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(screen.getByText("15.5 GB")).toBeInTheDocument()
        })
    })

    it("displays placeholder when stats are loading", () => {
        mockFetch.mockImplementation(() => new Promise(() => {}))

        render(
            <Sidebar
                onUploadStart={vi.fn()}
                onUploadProgress={vi.fn()}
                onUploadSuccess={vi.fn()}
                onUploadComplete={vi.fn()}
            />
        )

        expect(screen.getByText("-")).toBeInTheDocument()
    })

    it("does nothing when no file is selected", () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ({ totalGB: 5 })
        })

        const mockOnUploadStart = vi.fn()

        render(
            <Sidebar
                onUploadStart={mockOnUploadStart}
                onUploadProgress={vi.fn()}
                onUploadSuccess={vi.fn()}
                onUploadComplete={vi.fn()}
            />
        )

        const newButton = screen.getByRole("button", { name: /new/i })
        fireEvent.click(newButton)

        const fileInput = document.querySelector('input[type="file"]')
        fireEvent.change(fileInput, { target: { files: [] } })

        expect(mockOnUploadStart).not.toHaveBeenCalled()
    })
})
