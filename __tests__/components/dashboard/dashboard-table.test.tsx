import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardTable } from '@/components/dashboard/dashboard-table'

describe('DashboardTable', () => {
  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
  ]

  const testData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ]

  describe('rendering', () => {
    it('should render table headers', () => {
      render(<DashboardTable columns={columns} data={testData} />)

      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should render data rows', () => {
      render(<DashboardTable columns={columns} data={testData} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })

    it('should render correct number of rows', () => {
      render(<DashboardTable columns={columns} data={testData} />)

      const rows = screen.getAllByRole('row')
      // 1 header row + 2 data rows
      expect(rows).toHaveLength(3)
    })
  })

  describe('empty state', () => {
    it('should show default empty message when no data', () => {
      render(<DashboardTable columns={columns} data={[]} />)

      expect(screen.getByText('No se encontraron datos.')).toBeInTheDocument()
    })

    it('should show custom empty message', () => {
      render(
        <DashboardTable
          columns={columns}
          data={[]}
          emptyMessage="No hay resultados"
        />
      )

      expect(screen.getByText('No hay resultados')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      render(<DashboardTable columns={columns} data={[]} isLoading={true} />)

      // Should not show empty message when loading
      expect(screen.queryByText('No se encontraron datos.')).not.toBeInTheDocument()
    })

    it('should render specified number of skeleton rows', () => {
      render(
        <DashboardTable
          columns={columns}
          data={[]}
          isLoading={true}
          skeletonRows={3}
        />
      )

      const rows = screen.getAllByRole('row')
      // 1 header row + 3 skeleton rows
      expect(rows).toHaveLength(4)
    })

    it('should render 5 skeleton rows by default', () => {
      render(<DashboardTable columns={columns} data={[]} isLoading={true} />)

      const rows = screen.getAllByRole('row')
      // 1 header row + 5 skeleton rows
      expect(rows).toHaveLength(6)
    })
  })

  describe('custom cell rendering', () => {
    it('should use custom cell renderer when provided', () => {
      const columnsWithCustomCell = [
        { header: 'ID', accessor: 'id' },
        {
          header: 'Name',
          accessor: 'name',
          cell: (item: any) => <strong data-testid="custom-cell">{item.name.toUpperCase()}</strong>,
        },
      ]

      render(<DashboardTable columns={columnsWithCustomCell} data={testData} />)

      const customCells = screen.getAllByTestId('custom-cell')
      expect(customCells).toHaveLength(2)
      expect(customCells[0]).toHaveTextContent('JOHN DOE')
    })
  })

  describe('hidden columns', () => {
    it('should render hidden columns with appropriate class', () => {
      const columnsWithHidden = [
        { header: 'ID', accessor: 'id', hidden: true },
        { header: 'Name', accessor: 'name' },
      ]

      render(<DashboardTable columns={columnsWithHidden} data={testData} />)

      // Both headers should be rendered
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
    })
  })

  describe('column configuration', () => {
    it('should render all specified columns', () => {
      render(<DashboardTable columns={columns} data={testData} />)

      const headers = screen.getAllByRole('columnheader')
      expect(headers).toHaveLength(3)
    })

    it('should render data using accessor', () => {
      render(<DashboardTable columns={columns} data={testData} />)

      // Check that data is rendered using the accessor
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('table structure', () => {
    it('should have correct table structure', () => {
      render(<DashboardTable columns={columns} data={testData} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should have table header', () => {
      render(<DashboardTable columns={columns} data={testData} />)

      const headerCells = screen.getAllByRole('columnheader')
      expect(headerCells.length).toBeGreaterThan(0)
    })
  })
})
